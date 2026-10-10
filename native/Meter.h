#pragma once
#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <chrono>
#include <functional>
#include <vector>

namespace Wander {
constexpr double pi = 3.14159265358979323846;
inline double db(double energy) { return std::max(-120.0, 10 * std::log10(std::max(energy, 1e-12))); }
struct Biquad {
    double b0=1,b1=0,b2=0,a1=0,a2=0,z1=0,z2=0;
    double tick(double x) { double y=b0*x+z1; z1=b1*x-a1*y+z2; z2=b2*x-a2*y; return y; }
};
class Meter {
public:
    using Sink = std::function<void(const char*, const std::vector<float>&)>;
    Sink sink;
    double rate=48000, hold=-120;
    std::uint64_t count=0;
    void configure(double sampleRate) {
        rate=sampleRate; count=0; pos=0; frame=0; pitchId=0;
        session=1+static_cast<unsigned>(std::chrono::steady_clock::now().time_since_epoch().count()%16777214);
        shelf={}; hp={}; bands={}; histSum={}; histCount={}; totalEnergy=0; totalBlocks=0;
        hold=-120; clipped=false; peak=0; mid=side=0; bandSums={};
        energies.assign(static_cast<size_t>(std::round(rate*3)), 0);
        mSum=sSum=0; energyPos=0; audio.fill(0);
        double k=std::tan(pi*1681.974450955533/rate),q=.7071752369554196;
        double vh=std::pow(10,3.999843853973347/20),vb=std::pow(vh,.4996667741545416),norm=1+k/q+k*k;
        for(int c=0;c<2;++c) {
            shelf[c]={(vh+vb*k/q+k*k)/norm,2*(k*k-vh)/norm,(vh-vb*k/q+k*k)/norm,2*(k*k-1)/norm,(1-k/q+k*k)/norm};
            k=std::tan(pi*38.13547087602444/rate); q=.5003270373238773; norm=1+k/q+k*k;
            hp[c]={1,-2,1,2*(k*k-1)/norm,(1-k/q+k*k)/norm};
            k=std::tan(pi*1681.974450955533/rate);q=.7071752369554196;norm=1+k/q+k*k;
        }
        const double freqs[]={63,125,250,500,1000,2000,4000,8000};
        for(int j=0;j<8;++j) { double omega=2*pi*freqs[j]/rate,alpha=std::sin(omega)/2.4,a=1+alpha;
            for(int c=0;c<2;++c) bands[j][c]={alpha/a,0,-alpha/a,-2*std::cos(omega)/a,(1-alpha)/a}; }
        sinceMeter=sinceScope=sinceFFT=0;
    }
    Meter() { configure(48000); }
    void reset() { histSum={};histCount={};totalEnergy=0;totalBlocks=0;hold=-120;clipped=false; }
    double integrated() const {
        if(!totalBlocks)return -120;
        double threshold=std::max(-70.0,-.691+db(totalEnergy/totalBlocks)-10),sum=0,n=0;
        for(int j=0;j<1000;++j) if(-70+(j+.5)*.1>=threshold) {sum+=histSum[j];n+=histCount[j];}
        return n?-.691+db(sum/n):-120;
    }
    // Called only by the worker thread; the audio thread never performs analysis/network I/O.
    void push(float left,float right) {
        double l=std::isfinite(left)?left:0,r=std::isfinite(right)?right:0;
        audio[pos*2]=static_cast<float>(l);audio[pos*2+1]=static_cast<float>(r);pos=(pos+1)%65536;
        double kl=hp[0].tick(shelf[0].tick(l)),kr=hp[1].tick(shelf[1].tick(r)),e=kl*kl+kr*kr;
        size_t mWindow=static_cast<size_t>(std::round(rate*.4));
        mSum+=e-energies[(energyPos+energies.size()-mWindow)%energies.size()];
        sSum+=e-energies[energyPos];energies[energyPos]=e;energyPos=(energyPos+1)%energies.size();
        peak=std::max(peak,std::max(std::abs(l),std::abs(r)));
        mid+=(l+r)*(l+r)*.25;side+=(l-r)*(l-r)*.25;
        for(int j=0;j<8;++j) {double bl=bands[j][0].tick(l),br=bands[j][1].tick(r);bandSums[j]+=bl*bl+br*br;}
        ++count;++sinceMeter;++sinceScope;++sinceFFT;
        if(sinceScope>=static_cast<size_t>(rate*.025)) { scope();sinceScope=0; }
        if(sinceMeter>=static_cast<size_t>(rate*.1)) { meter();pitch();sinceMeter=0; }
        if(sinceFFT>=static_cast<size_t>(rate*.125)) { fft();sinceFFT=0; }
    }
private:
    std::array<Biquad,2> shelf,hp;
    std::array<std::array<Biquad,2>,8> bands;
    std::array<double,8> bandSums{};
    std::array<float,65536*2> audio{};
    std::vector<double> energies;
    std::array<double,1000> histSum{};
    std::array<std::uint64_t,1000> histCount{};
    double totalEnergy=0,mSum=0,sSum=0,peak=0,mid=0,side=0;
    bool clipped=false;
    std::uint64_t totalBlocks=0;
    size_t pos=0,energyPos=0,sinceMeter=0,sinceScope=0,sinceFFT=0;
    int frame=0,pitchId=0;
    unsigned session=1;
    float sample(size_t ago,int c)const { return audio[((pos+65536-ago%65536)%65536)*2+c]; }
    void emit(const char* name,const std::vector<float>& v) { if(sink)sink(name,v); }
    void meter() {
        double m=count>=static_cast<size_t>(rate*.4)?-.691+db(std::max(0.0,mSum)/(rate*.4)):-120;
        double s=count>=static_cast<size_t>(rate*3)?-.691+db(std::max(0.0,sSum)/(rate*3)):-120;
        if(m>=-70){int b=std::clamp(static_cast<int>((m+70)*10),0,999);double e=std::max(0.0,mSum)/(rate*.4);histSum[b]+=e;++histCount[b];totalEnergy+=e;++totalBlocks;}
        double peakDb=db(peak*peak);hold=std::max(hold,peakDb);clipped=clipped||peak>=1;
        std::vector<float> v={float(m),float(s),float(integrated()),float(peakDb),float(hold),clipped?1.f:0.f};
        for(double e:bandSums)v.push_back(float(db(e/sinceMeter)));
        v.push_back(float(mid/sinceMeter));v.push_back(float(side/sinceMeter));emit("/yfc/meter",v);
        peak=mid=side=0;bandSums={};
    }
    void scope() {
        size_t n=static_cast<size_t>(rate*.02);
        std::vector<float> v={20};
        for(size_t j=0;j<128;++j){size_t ago=n-j*n/128;v.push_back(sample(ago,0));v.push_back(sample(ago,1));}
        for(size_t j=0;j<64;++j){float loL=1e30f,hiL=-1e30f,loR=1e30f,hiR=-1e30f;
            for(size_t k=j*n/64;k<(j+1)*n/64;++k){float l=sample(n-k,0),r=sample(n-k,1);loL=std::min(loL,l);hiL=std::max(hiL,l);loR=std::min(loR,r);hiR=std::max(hiR,r);}
            v.insert(v.end(),{loL,hiL,loR,hiR});}emit("/yfc/scope",v);
    }
    void pitch() {
        if(count<static_cast<size_t>(rate*.09))return;
        double pl=0,pr=0;size_t n=static_cast<size_t>(rate*.09);
        for(size_t j=1;j<=n;++j){pl+=sample(j,0)*sample(j,0);pr+=sample(j,1)*sample(j,1);}
        int channel=pr>pl?1:0;pitchId=(pitchId+1)%1000000;
        for(int start=0;start<1080;start+=600){std::vector<float> v={float(pitchId),12000,float(start),1080};
            for(int j=start;j<std::min(1080,start+600);++j){double ago=(1080-j)*rate/12000;size_t a=static_cast<size_t>(ago);double f=ago-a;v.push_back(float(sample(a,channel)*(1-f)+sample(a+1,channel)*f));}
            emit("/yfc/pitchchunk",v);}
    }
    void fft() {
        size_t n=8192;while(n<rate*.34)n*=2;if(count<n)return;
        frame=(frame+1)%1000000;
        for(size_t start=0;start<n;start+=300){std::vector<float> v={float(session),float(frame),float(rate),float(start*2),float(n)};
            for(size_t j=start;j<std::min(n,start+300);++j){v.push_back(sample(n-j,0));v.push_back(sample(n-j,1));}
            emit("/yfc/fftchunk2",v);}
    }
};
}
