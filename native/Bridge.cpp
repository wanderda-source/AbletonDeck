#include "public.sdk/source/vst/vstaudioeffect.h"
#include "public.sdk/source/vst/vsteditcontroller.h"
#include "public.sdk/source/main/pluginfactory.h"
#include "pluginterfaces/vst/ivstprocesscontext.h"
#include "Meter.h"
#include <atomic>
#include <chrono>
#include <cstring>
#include <cstdlib>
#include <memory>
#include <thread>
#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
using Socket=SOCKET;
#else
#include <arpa/inet.h>
#include <fcntl.h>
#include <sys/socket.h>
#include <unistd.h>
using Socket=int;
#endif

namespace Wander {
using namespace Steinberg;
using namespace Steinberg::Vst;
const FUID processorId(0x783D76AF,0x446C4E47,0x9861B6A0,0x387F5712);
const FUID controllerId(0xFA08B61E,0x02B84FBC,0x85C36A71,0x9C237715);
struct Block { double rate=48000; size_t n=0; std::uint64_t sequence=0; std::array<float,512> samples{}; };
class Sender {
public:
    std::array<Block,128> queue;
    std::atomic<size_t> read{0},write{0};
    std::atomic<bool> stopping{false};
    std::uint64_t sequence=0;
    unsigned portBase=17940;
    Meter meter;
    std::thread worker;
    Sender(unsigned base=17940):portBase(base) {
        if(base==17940&&std::getenv("WANDER_SCOPE_DISABLE_TELEMETRY"))return;
        worker=std::thread([this]{run();});
    }
    ~Sender(){stopping.store(true);if(worker.joinable())worker.join();}
    // Single producer, preallocated queue. Drop telemetry rather than block audio.
    template<typename T> void enqueue(T** channels,int numChannels,int n,double rate,std::uint64_t silence) {
        for(int start=0;start<n;start+=256){size_t w=write.load(std::memory_order_relaxed),next=(w+1)%queue.size();++sequence;
            if(next==read.load(std::memory_order_acquire))continue;
            auto& b=queue[w];b.n=static_cast<size_t>(std::min(256,n-start));b.rate=rate;b.sequence=sequence;
            for(size_t j=0;j<b.n;++j){b.samples[j*2]=(silence&1)?0:float(channels[0][start+j]);
                b.samples[j*2+1]=numChannels==1?b.samples[j*2]:((silence&2)?0:float(channels[1][start+j]));}
            write.store(next,std::memory_order_release);}
    }
private:
    Socket sock;
    sockaddr_in destination{};
    void osc(const char* address,const std::vector<float>& values) {
        std::array<char,4096> data{};size_t a=std::strlen(address)+1,tag=1+values.size()+1;
        a=(a+3)&~size_t(3);tag=(tag+3)&~size_t(3);
        if(a+tag+values.size()*4>data.size())return;
        std::memcpy(data.data(),address,std::strlen(address));data[a]=',';
        for(size_t j=0;j<values.size();++j){data[a+j+1]='f';std::uint32_t bits;std::memcpy(&bits,&values[j],4);bits=htonl(bits);std::memcpy(data.data()+a+tag+j*4,&bits,4);}
        sendto(sock,data.data(),static_cast<int>(a+tag+values.size()*4),0,reinterpret_cast<sockaddr*>(&destination),sizeof(destination));
    }
    void run() {
#ifdef _WIN32
        WSADATA info;if(WSAStartup(MAKEWORD(2,2),&info)!=0)return;
#endif
        sock=socket(AF_INET,SOCK_DGRAM,0);
#ifdef _WIN32
        if(sock==INVALID_SOCKET){WSACleanup();return;}
        u_long nonblocking=1;ioctlsocket(sock,FIONBIO,&nonblocking);
#else
        if(sock<0)return;
        fcntl(sock,F_SETFL,O_NONBLOCK);
#endif
        destination.sin_family=AF_INET;destination.sin_port=htons(static_cast<uint16_t>(portBase+1));destination.sin_addr.s_addr=htonl(INADDR_LOOPBACK);
        sockaddr_in resetAddress=destination;resetAddress.sin_port=htons(static_cast<uint16_t>(portBase+2));
        // Only one source device per project. If the reset port is occupied, don't steal it.
        bind(sock,reinterpret_cast<sockaddr*>(&resetAddress),sizeof(resetAddress));
        meter.sink=[this](const char* name,const std::vector<float>& v){osc(name,v);};
        std::uint64_t lastSequence=0;bool idleSent=false;
        auto lastAudio=std::chrono::steady_clock::now(),lastIdle=lastAudio;
        while(!stopping.load()){
            char reset[256];sockaddr_in peer{};
#ifdef _WIN32
            int peerSize=sizeof(peer);
#else
            socklen_t peerSize=sizeof(peer);
#endif
            int received=recvfrom(sock,reset,sizeof(reset),0,reinterpret_cast<sockaddr*>(&peer),&peerSize);
            if(received>=11&&peer.sin_addr.s_addr==htonl(INADDR_LOOPBACK)&&std::memcmp(reset,"/yfc/reset\0",11)==0)meter.reset();
            size_t r=read.load(std::memory_order_relaxed);
            if(r!=write.load(std::memory_order_acquire)){
                const auto& b=queue[r];
                if(meter.rate!=b.rate||(lastSequence&&b.sequence!=lastSequence+1))meter.configure(b.rate);
                lastSequence=b.sequence;idleSent=false;
                for(size_t j=0;j<b.n;++j)meter.push(b.samples[j*2],b.samples[j*2+1]);
                read.store((r+1)%queue.size(),std::memory_order_release);lastAudio=std::chrono::steady_clock::now();
            }else{
                auto now=std::chrono::steady_clock::now();
                // Hosts can suspend DSP at stop. Keep zero-state meters/scopes connected.
                if(now-lastAudio>std::chrono::milliseconds(150)&&now-lastIdle>=std::chrono::milliseconds(100)){
                    idleSent=true;
                    for(size_t j=0;j<static_cast<size_t>(meter.rate*.1);++j)meter.push(0,0);
                    lastIdle=now;
                }
                std::this_thread::sleep_for(std::chrono::milliseconds(2));
            }
        }
#ifdef _WIN32
        closesocket(sock);WSACleanup();
#else
        close(sock);
#endif
    }
};
class Bridge final:public AudioEffect {
    std::unique_ptr<Sender> sender;
    unsigned portBase;
public:
    Bridge(unsigned base=17940):portBase(base){setControllerClass(controllerId);}
    static FUnknown* create(void*){return static_cast<IAudioProcessor*>(new Bridge);}
    tresult PLUGIN_API initialize(FUnknown* context)override {
        auto result=AudioEffect::initialize(context);if(result!=kResultOk)return result;
        addAudioInput(STR16("Input"),SpeakerArr::kStereo);addAudioOutput(STR16("Output"),SpeakerArr::kStereo);return kResultOk;
    }
    tresult PLUGIN_API setBusArrangements(SpeakerArrangement* in,int32 ni,SpeakerArrangement* out,int32 no)override {
        if(ni!=1||no!=1||in[0]!=out[0]||(in[0]!=SpeakerArr::kMono&&in[0]!=SpeakerArr::kStereo))return kResultFalse;
        getAudioInput(0)->setArrangement(in[0]);getAudioOutput(0)->setArrangement(out[0]);return kResultOk;
    }
    tresult PLUGIN_API canProcessSampleSize(int32 size)override{return (size==kSample32||size==kSample64)?kResultTrue:kResultFalse;}
    tresult PLUGIN_API setupProcessing(ProcessSetup& setup)override {
        if(setup.sampleRate<22050||setup.sampleRate>192000)return kResultFalse;
        return AudioEffect::setupProcessing(setup);
    }
    tresult PLUGIN_API setActive(TBool active)override {
        if(active){try{sender=std::make_unique<Sender>(portBase);}catch(...){return kResultFalse;}}else sender.reset();
        return AudioEffect::setActive(active);
    }
    tresult PLUGIN_API terminate()override{sender.reset();return AudioEffect::terminate();}
    template<typename T> void pass(T** in,T** out,int channels,int n,std::uint64_t flags) {
        for(int c=0;c<channels;++c) {
            if(flags&(std::uint64_t(1)<<c))std::memset(out[c],0,n*sizeof(T));
            else if(in[c]!=out[c])std::memcpy(out[c],in[c],n*sizeof(T));
        }
        if(sender&&processSetup.processMode!=kOffline)sender->enqueue(in,channels,n,processSetup.sampleRate,flags);
    }
    tresult PLUGIN_API process(ProcessData& data)override {
        if(!data.numInputs||!data.numOutputs||data.numSamples<=0)return kResultOk;
        auto& in=data.inputs[0];auto& out=data.outputs[0];
        if(in.numChannels!=out.numChannels||(in.numChannels!=1&&in.numChannels!=2))return kResultFalse;
        out.silenceFlags=in.silenceFlags;
        if(data.symbolicSampleSize==kSample64)pass(in.channelBuffers64,out.channelBuffers64,in.numChannels,data.numSamples,in.silenceFlags);
        else pass(in.channelBuffers32,out.channelBuffers32,in.numChannels,data.numSamples,in.silenceFlags);
        return kResultOk;
    }
};
class Controller final:public EditController {
public:
    static FUnknown* create(void*){return static_cast<IEditController*>(new Controller);}
};
}
using namespace Steinberg;
using namespace Steinberg::Vst;
BEGIN_FACTORY_DEF("Wanderwave","https://github.com/wanderda-source/AbletonDeck","")
DEF_CLASS2(INLINE_UID_FROM_FUID(Wander::processorId),PClassInfo::kManyInstances,kVstAudioEffectClass,"Wander_scope",Vst::kDistributable,"Fx|Analyzer","0.4.0",kVstVersionString,Wander::Bridge::create)
DEF_CLASS2(INLINE_UID_FROM_FUID(Wander::controllerId),PClassInfo::kManyInstances,kVstComponentControllerClass,"Wander_scope Controller",0,"","0.4.0",kVstVersionString,Wander::Controller::create)
END_FACTORY
