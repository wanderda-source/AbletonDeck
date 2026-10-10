// Tests an actual VST processor and worker on separate UDP ports, never a running Live.
#include "Bridge.cpp"
#include "public.sdk/source/vst/hosting/hostclasses.h"
#include <iostream>
#include <stdexcept>
void* moduleHandle=nullptr;
void require(bool b,const char* reason){if(!b)throw std::runtime_error(reason);}
int main(){
#ifdef _WIN32
    WSADATA info;WSAStartup(MAKEWORD(2,2),&info);
#endif
    Socket receiver=socket(AF_INET,SOCK_DGRAM,0);sockaddr_in address{};address.sin_family=AF_INET;address.sin_addr.s_addr=htonl(INADDR_LOOPBACK);
    address.sin_port=0;require(bind(receiver,reinterpret_cast<sockaddr*>(&address),sizeof(address))==0,"Test socket");
#ifdef _WIN32
    int length=sizeof(address);u_long nb=1;ioctlsocket(receiver,FIONBIO,&nb);
#else
    socklen_t length=sizeof(address);fcntl(receiver,F_SETFL,O_NONBLOCK);
#endif
    getsockname(receiver,reinterpret_cast<sockaddr*>(&address),&length);
    auto portBase=static_cast<unsigned>(ntohs(address.sin_port)-1);
    auto host=Steinberg::owned(new Steinberg::Vst::HostApplication);
    auto bridge=Steinberg::owned(new Wander::Bridge(portBase));
    require(bridge->initialize(host)==Steinberg::kResultOk,"Initialize");
    Steinberg::Vst::ProcessSetup setup{};setup.processMode=Steinberg::Vst::kRealtime;setup.symbolicSampleSize=Steinberg::Vst::kSample32;setup.maxSamplesPerBlock=256;setup.sampleRate=48000;
    require(bridge->setupProcessing(setup)==Steinberg::kResultOk,"Setup");require(bridge->setActive(true)==Steinberg::kResultOk,"Activate");bridge->setProcessing(true);
    std::array<float,256> l,r,outL,outR;float* input[]={l.data(),r.data()};float* output[]={outL.data(),outR.data()};
    Steinberg::Vst::AudioBusBuffers in{},out{};in.numChannels=out.numChannels=2;in.channelBuffers32=input;out.channelBuffers32=output;
    Steinberg::Vst::ProcessData data{};data.numSamples=256;data.numInputs=data.numOutputs=1;data.inputs=&in;data.outputs=&out;data.symbolicSampleSize=Steinberg::Vst::kSample32;
    bool meter=false,scope=false,fft=false,pitch=false;
    for(int b=0;b<110;++b){
        for(size_t j=0;j<256;++j){l[j]=float(.1*std::sin(2*Wander::pi*1000*(b*256+j)/48000));r[j]=-l[j];}
        require(bridge->process(data)==Steinberg::kResultOk,"Process");require(l==outL&&r==outR,"Bit exact stereo passthrough");
        std::this_thread::sleep_for(std::chrono::milliseconds(6));
        char packet[4096];int received;
        while((received=recv(receiver,packet,sizeof(packet),0))>0){
            require(std::memchr(packet,0,received)!=nullptr,"OSC address terminated");
            meter=meter||std::strcmp(packet,"/yfc/meter")==0;scope=scope||std::strcmp(packet,"/yfc/scope")==0;
            fft=fft||std::strcmp(packet,"/yfc/fftchunk2")==0;pitch=pitch||std::strcmp(packet,"/yfc/pitchchunk")==0;
        }
    }
    require(meter&&scope&&fft&&pitch,"All HUD protocol streams reach UDP");
    in.silenceFlags=3;outL.fill(1);outR.fill(1);bridge->process(data);
    for(float x:outL)require(x==0,"Silence flag honored");
    bridge->setProcessing(false);bridge->setActive(false);
    setup.symbolicSampleSize=Steinberg::Vst::kSample64;setup.processMode=Steinberg::Vst::kOffline;
    require(bridge->setupProcessing(setup)==Steinberg::kResultOk,"64 bit offline setup");
    std::array<double,256> dl,dr,doL,doR;dl.fill(.123456789012);dr.fill(-.123456789012);double* di[]={dl.data(),dr.data()};double* dout[]={doL.data(),doR.data()};
    in.silenceFlags=0;in.channelBuffers64=di;out.channelBuffers64=dout;data.symbolicSampleSize=Steinberg::Vst::kSample64;
    bridge->process(data);require(dl==doL&&dr==doR,"Bit exact double precision passthrough");bridge->terminate();
#ifdef _WIN32
    closesocket(receiver);WSACleanup();
#else
    close(receiver);
#endif
    std::cout<<"PASS: actual processor, 32/64 bit transparency, silence and worker UDP streams\n";
}
