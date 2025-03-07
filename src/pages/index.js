import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import Layout from '../components/layout/Layout';

export default function Home() {
  const [isVisible, setIsVisible] = useState({
    hero: false,
    features: false,
    workflow: false,
    cta: false
  });
  
  const sectionRefs = {
    hero: useRef(null),
    features: useRef(null),
    workflow: useRef(null),
    cta: useRef(null)
  };

  // Intersection Observer for animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -100px 0px"
    };

    const observers = Object.entries(sectionRefs).map(([key, ref]) => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [key]: true }));
            observer.unobserve(entry.target);
          }
        });
      }, observerOptions);
      
      if (ref.current) {
        observer.observe(ref.current);
      }
      
      return observer;
    });

    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, []);

  // Auto-show the hero section
  useEffect(() => {
    setIsVisible(prev => ({ ...prev, hero: true }));
  }, []);

  // Features data
  const features = [
    {
      icon: "🔍",
      title: "Smart Contract Analysis",
      description: "Our AI analyzes smart contract code to identify vulnerabilities, risks, and potential exploits."
    },
    {
      icon: "🤖",
      title: "Multi-AI Consensus",
      description: "Multiple AI models analyze your contract and reach consensus for more accurate results."
    },
    {
      icon: "🧠",
      title: "Plain English Explanations",
      description: "Get clear explanations of what contracts do and any risks they pose, without technical jargon."
    },
    {
      icon: "⚡",
      title: "Fast Results",
      description: "Get comprehensive analysis in minutes instead of waiting days for manual audits."
    },
    {
      icon: "🛡️",
      title: "Security Scoring",
      description: "Each contract receives a security score and risk assessment based on identified issues."
    },
    {
      icon: "📜",
      title: "Certification",
      description: "Mint NFT certificates for contracts that pass security checks as proof of audit."
    }
  ];

  // Workflow steps
  const workflowSteps = [
    {
      number: "01",
      title: "Input Contract",
      description: "Paste any verified smart contract address from Ethereum, Polygon, or other supported networks.",
      color: "from-blue-500 to-blue-600"
    },
    {
      number: "02",
      title: "AI Analysis",
      description: "Our Multi-AI system performs deep analysis using various models and static analysis tools.",
      color: "from-purple-500 to-purple-600"
    },
    {
      number: "03",
      title: "Review Findings",
      description: "Get detailed explanations of contract functionality and any security risks discovered.",
      color: "from-indigo-500 to-indigo-600"
    },
    {
      number: "04",
      title: "Verify Safety",
      description: "Understand the contract's security score and make informed decisions before interacting.",
      color: "from-pink-500 to-pink-600"
    }
  ];

  return (
    <Layout>
      <Head>
        <title>DeFi Watchdog - AI-Powered Smart Contract Auditor</title>
        <meta name="description" content="DeFi Watchdog uses multiple AI models to analyze smart contracts and explain risks in plain English." />
      </Head>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-28" ref={sectionRefs.hero}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50"></div>
        
        {/* Background animation elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-20 right-[10%] w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
          <div className="absolute top-40 left-[5%] w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-[10%] right-[20%] w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Hero Content with Animations */}
            <div className={`transition-all duration-1000 ${isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-4">AI-Powered Security</span>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Know Your Smart Contract 
                <span className="text-gradient block mt-2">Before You Interact</span>
              </h1>
              
              <p className="text-gray-600 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
                DeFi Watchdog uses multiple AI models working together to analyze smart contracts and explain risks in plain English.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/audit" className="btn btn-primary px-8 py-3 text-base rounded-lg group">
                  Start Auditing
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                
                <Link href="/how-it-works" className="btn btn-tertiary group">
                  How It Works
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
            
            {/* Stats */}
            <div className={`mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 transition-all duration-1000 delay-500 ${isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="bg-white bg-opacity-70 backdrop-blur-sm rounded-xl p-4 shadow-md">
                <p className="text-gray-500 text-sm">Contracts Audited</p>
                <p className="text-3xl font-bold text-gray-800">12,000+</p>
              </div>
              <div className="bg-white bg-opacity-70 backdrop-blur-sm rounded-xl p-4 shadow-md">
                <p className="text-gray-500 text-sm">Issues Found</p>
                <p className="text-3xl font-bold text-gray-800">45,000+</p>
              </div>
              <div className="bg-white bg-opacity-70 backdrop-blur-sm rounded-xl p-4 shadow-md">
                <p className="text-gray-500 text-sm">Networks</p>
                <p className="text-3xl font-bold text-gray-800">10+</p>
              </div>
              <div className="bg-white bg-opacity-70 backdrop-blur-sm rounded-xl p-4 shadow-md">
                <p className="text-gray-500 text-sm">Savings Estimated</p>
                <p className="text-3xl font-bold text-gray-800">$10M+</p>
              </div>
            </div>
          </div>
          
          {/* Animated Demo */}
          <div className={`mt-16 max-w-3xl mx-auto transition-all duration-1000 delay-700 ${isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="relative bg-white rounded-xl p-1 shadow-xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
              <div className="rounded-lg overflow-hidden">
                <div className="bg-gray-900 text-gray-200 py-2 px-4 flex items-center">
                  <div className="flex space-x-2 mr-4">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <p className="text-sm font-mono">defi-watchdog.ai ~ contract analysis</p>
                </div>
                
                <div className="p-4 bg-gray-50">
                  <div className="animate-pulse space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded bg-blue-200"></div>
                      <div className="h-6 rounded bg-blue-200 w-1/3"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                    
                    <div className="py-2">
                      <div className="h-6 bg-blue-100 rounded w-1/4 mb-2"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <div className="h-6 bg-yellow-100 rounded w-1/4 mb-2"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <div className="h-8 bg-blue-400 rounded w-1/6"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white" ref={sectionRefs.features}>
        <div className="container">
          <div className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-1000 ${isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Comprehensive AI Audit System
            </h2>
            <p className="text-gray-600 text-lg">
              Our multi-AI approach combines the strengths of different models to provide the most accurate and thorough analysis of your smart contracts.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`card group hover:border-blue-200 border border-transparent transition-all duration-1000 ${isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${100 * index}ms` }}
              >
                <div className="flex flex-col h-full">
                  <div className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center text-xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    {feature.icon}
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-600 flex-grow">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Workflow Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white" ref={sectionRefs.workflow}>
        <div className="container">
          <div className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-1000 ${isVisible.workflow ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              How It Works
            </h2>
            <p className="text-gray-600 text-lg">
              Our streamlined process makes it easy to audit any smart contract in minutes.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200"></div>
            
            {workflowSteps.map((step, index) => (
              <div 
                key={index} 
                className={`relative transition-all duration-1000 ${isVisible.workflow ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${200 * index}ms` }}
              >
                <div className="card hover:shadow-xl hover:-translate-y-2 bg-white">
                  <div className={`absolute -top-5 -left-5 w-10 h-10 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-white font-bold shadow-lg z-10`}>
                    {step.number}
                  </div>
                  
                  {/* Radar animation effect */}
                  <div className="absolute -top-5 -left-5 w-10 h-10 rounded-full">
                    <span className={`absolute inset-0 rounded-full bg-gradient-to-r ${step.color} opacity-60 animate-ripple`}></span>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white" ref={sectionRefs.cta}>
        <div className="container">
          <div className={`max-w-3xl mx-auto text-center transition-all duration-1000 ${isVisible.cta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Secure Your DeFi Interactions?
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Don't risk your funds on untrusted contracts. Get an AI audit in minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link href="/audit" className="btn px-8 py-4 rounded-lg bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                Analyze a Contract
              </Link>
              <Link href="/how-it-works" className="btn px-8 py-4 rounded-lg bg-transparent border border-white hover:bg-white/10">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}