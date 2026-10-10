#include "Meter.h"
#include <iostream>
#include <memory>
#include <stdexcept>
#include <string>
void check(bool condition,const char* text){if(!condition)throw std::runtime_error(text);}
int main(){
    auto m=std::make_unique<Wander::Meter>();
    for(double rate:{44100.,48000.,96000.,192000.}){
        m->configure(rate);std::vector<float> last;int scopes=0,ffts=0,pitches=0;
        m->sink=[&](const char* name,const std::vector<float>& v){
            for(float x:v)check(std::isfinite(x),"Nonfinite OSC sample");
            if(std::string(name)=="/yfc/meter"){check(v.size()==16,"Meter shape");last=v;}
            if(std::string(name)=="/yfc/scope"){check(v.size()==513,"Scope shape");++scopes;}
            if(std::string(name)=="/yfc/fftchunk2"){check(v.size()<=605,"FFT chunk bound");++ffts;}
            if(std::string(name)=="/yfc/pitchchunk"){check(v.size()<=604,"Pitch chunk bound");++pitches;}
        };
        for(int j=0;j<static_cast<int>(rate*3.2);++j){float x=float(.1*std::sin(2*Wander::pi*1000*j/rate));m->push(x,x);}
        check(std::abs(last[0]+20)<.25,"Stereo 1kHz LUFS calibration");
        check(std::abs(last[1]+20)<.25,"Short term calibration");
        check(std::abs(last[3]+20)<.05,"Sample peak calibration");
        check(last[14]>.0049&&last[15]<1e-12,"Mid side mono");
        check(scopes>100&&ffts>100&&pitches>10,"Packet schedules");
        for(int j=0;j<static_cast<int>(rate*.2);++j){float x=float(.1*std::sin(2*Wander::pi*1000*j/rate));m->push(x,-x);}
        check(last[14]<1e-12&&last[15]>.0049,"Anti phase stereo preserved");
        m->reset();check(m->hold==-120&&m->integrated()==-120,"Reset integrated and peak");
        m->configure(rate);for(int j=0;j<static_cast<int>(rate*3.2);++j)m->push(0,0);
        check(last[0]<=-120&&last[3]<=-120&&last[14]==0&&last[15]==0,"Silence stable");
        std::cout<<"PASS meter: "<<rate<<" Hz, LUFS/peak/stereo/reset/silence/packet sizes\n";
    }
}
