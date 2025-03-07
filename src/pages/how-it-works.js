import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import Layout from '../components/layout/Layout';
import Link from 'next/link';

export default function HowItWorks() {
  const [isVisible, setIsVisible] = useState({
    hero: false,
    process: false,
    aiExplained: false,
    faq: false
  });
  
  const sectionRefs = {
    hero: useRef(null),
    process: useRef(null),
    aiExplained: useRef(null),
    faq: useRef(null)
  };
  
  // Active FAQ item state
  const [activeFaq, setActiveFaq] = useState(null);

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

  // Process steps data
  const steps = [
    {
      icon: "📋",
      title: "Input Contract Address",
      description: "Paste the address of any verified smart contract you want to analyze.",
      details: "DeFi Watchdog supports contracts on Ethereum Mainnet, Goerli, Sepolia, Polygon, Arbitrum, Optimism, and several L2 networks including Linea."
    },
    {
      icon: "🧠",
      title: "Multi-AI Analysis",
      description: "Our AI engine uses multiple models that work together to analyze the contract code.",
      details: "The system combines GPT-4, Deepseek, Mistral, and other specialized AI models alongside static analysis tools for comprehensive coverage."
    },
    {
      icon: "📊",
      title: "Review Results",
      description: "Get a clear explanation of what the contract does and any security risks it poses.",
      details: "Results include contract functionality, security score, risk level, detailed findings with severity ratings, and recommendations for each issue found."
    },
    {
      icon: "🛡️",
      title: "Certificate (Optional)",
      description: "For safe contracts, mint an NFT certificate as proof of auditing.",
      details: "Certificates include the contract address, security score, audit date, and findings summary. They're stored on-chain for permanent verification."
    }
  ];

  // FAQ items
  const faq = [
    {
      question: "How accurate is the AI analysis?",
      answer: 
        "Our multi-AI system combines multiple large language models (GPT-4, Deepseek, and Mistral) with specialized static analysis tools to achieve high accuracy. By having AIs validate each other's findings, we eliminate many false positives and produce more reliable results. While it's highly effective at identifying common vulnerabilities and explaining contract functionality, we still recommend professional audits for high-value contracts or complex protocols. DeFi Watchdog is designed to give you a quick first assessment and identify obvious security issues."
    },
    {
      question: "Can I analyze any contract?",
      answer: 
        "You can analyze any contract that has verified source code on Etherscan or other supported block explorers. Contracts without verified source code cannot be analyzed because our system needs to read the actual code. Currently, we support Solidity contracts on EVM-compatible chains. Support for other languages like Vyper is planned for future releases."
    },
    {
      question: "What networks are supported?",
      answer: 
        "We currently support Ethereum Mainnet, Goerli, Sepolia, Polygon, Arbitrum, Optimism, Linea, and several other EVM-compatible networks. We're continuously adding support for more networks based on user demand. If you need support for a specific network, please let us know!"
    },
    {
      question: "How does the Multi-AI consensus system work?",
      answer: 
        "Our Multi-AI approach uses multiple AI models that analyze the same contract independently. First, each AI (GPT-4, Deepseek, Mistral) examines the contract and identifies potential issues. Then, we run specialized tools like Slither and Mythril for static analysis. Finally, we have the AIs discuss and debate their findings, challenging each other's conclusions to eliminate false positives and reach consensus. This approach provides more accurate and reliable results than using a single AI model."
    },
    {
      question: "What are the NFT certificates?",
      answer: 
        "For contracts that pass our security checks, you can mint an NFT certificate as proof that the contract was audited. This certificate contains information about the audit including the contract address, security score, audit date, and findings. Certificates are stored on-chain and can be verified by anyone. They can be used by project teams to demonstrate they've conducted security checks on their contracts."
    },
    {
      question: "How much does it cost to use DeFi Watchdog?",
      answer: 
        "Basic contract analysis is free for everyone. We offer premium features for advanced users, including detailed vulnerability explanations, code fix suggestions, and certificate minting. Our goal is to make smart contract security accessible to everyone while providing additional value for power users."
    }
  ];

  // AI Explained diagram components
  const aiComponents = [
    {
      title: "OpenAI (GPT-4)",
      icon: "🤖",
      description: "Focuses on general code analysis and natural language explanations"
    },
    {
      title: "Deepseek",
      icon: "🔍",
      description: "Specialized in code pattern recognition and vulnerability detection"
    },
    {
      title: "Mistral",
      icon: "🧩",
      description: "Excels at understanding contract architecture and data flows"
    },
    {
      title: "Slither",
      icon: "🐍",
      description: "Static analysis tool for detecting common vulnerability patterns"
    },
    {
      title: "Mythril",
      icon: "⚒️",
      description: "Symbolic execution tool for finding complex logical vulnerabilities"
    }
  ];

  return (
    <Layout>
      <Head>
        <title>How It Works - DeFi Watchdog</title>
        <meta name="description" content="Learn how DeFi Watchdog uses Multi-AI technology to analyze smart contracts and keep you safe." />
      </Head>

      {/* Hero Section */}
      <section 
        className="relative pt-32 pb-20 overflow-hidden" 
        ref={sectionRefs.hero}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 z-0"></div>
        
        {/* Background texture */}
        <div className="absolute inset-0 z-0 opacity-30">
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 0 10 L 40 10 M 10 0 L 10 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" stroke="currentColor" strokeWidth="0.5" />
          </svg>
        </div>
        
        <div className="container relative z-10">
          <div className={`max-w-3xl mx-auto text-center transition-all duration-1000 ${isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-4">
              Our Technology
            </span>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              How DeFi Watchdog Works
            </h1>
            
            <p className="text-lg text-gray-600 mb-8">
              Learn how our Multi-AI system analyzes smart contracts to keep you safe in DeFi
            </p>
            
            <div className="flex justify-center">
              <Link href="/audit" className="btn btn-primary">
                Try It Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section 
        className="py-20 bg-white" 
        id="process" 
        ref={sectionRefs.process}
      >
        <div className="container">
          <div className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-1000 ${isVisible.process ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl font-bold mb-4">Four Simple Steps</h2>
            <p className="text-gray-600">
              Our streamlined process makes it easy to audit any smart contract in minutes
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gray-200 z-0"></div>
            
            {steps.map((step, index) => (
              <div 
                key={index} 
                className={`relative transition-all duration-1000 ${isVisible.process ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                {/* Step number */}
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mb-6 mx-auto z-10 relative">
                  {index + 1}
                </div>
                
                {/* Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 transition-all duration-300 hover:shadow-lg group h-full">
                  <div className="w-14 h-14 rounded-xl bg-blue-100 text-3xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    {step.icon}
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-gray-600 mb-4">{step.description}</p>
                  
                  <div className="mt-auto bg-gray-50 -mx-6 -mb-6 p-4 text-sm text-gray-500 rounded-b-xl">
                    {step.details}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* AI Explained Section */}
      <section 
        className="py-20 bg-gradient-to-b from-blue-50 to-white relative overflow-hidden"
        id="ai-explained"
        ref={sectionRefs.aiExplained}
      >
        {/* Background abstract elements */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden">
          <svg width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-30">
            <circle cx="80%" cy="20%" r="100" fill="#60A5FA" fillOpacity="0.2" />
            <circle cx="20%" cy="80%" r="120" fill="#818CF8" fillOpacity="0.2" />
            <path d="M0 100 Q 250 50 500 100 T 1000 100" stroke="#60A5FA" strokeOpacity="0.2" strokeWidth="2" />
            <path d="M0 130 Q 250 80 500 130 T 1000 130" stroke="#818CF8" strokeOpacity="0.2" strokeWidth="2" />
            <path d="M0 160 Q 250 110 500 160 T 1000 160" stroke="#60A5FA" strokeOpacity="0.2" strokeWidth="2" />
          </svg>
        </div>
        
        <div className="container relative">
          <div className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-1000 ${isVisible.aiExplained ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl font-bold mb-4">Multi-AI System Explained</h2>
            <p className="text-gray-600">
              Our unique approach combines multiple AI models with specialized tools to provide the most accurate analysis
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Visual Diagram */}
            <div className={`transition-all duration-1000 delay-300 ${isVisible.aiExplained ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <div className="relative p-8 bg-white rounded-2xl shadow-lg">
                {/* Central Hub */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
                  <div className="text-center">
                    <div className="text-xs font-semibold mb-1">CONSENSUS</div>
                    <div className="text-2xl">🧠</div>
                  </div>
                </div>
                
                {/* AI Components */}
                <div className="w-full h-64 relative">
                  {aiComponents.map((component, index) => {
                    // Calculate position around the circle
                    const angle = (index * 2 * Math.PI) / aiComponents.length;
                    const radius = 120; // Distance from center
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    
                    return (
                      <div 
                        key={index}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white rounded-lg shadow-md flex flex-col items-center justify-center text-center border border-gray-200 group hover:border-blue-400 transition-all duration-300 animate-float"
                        style={{ 
                          left: `calc(50% + ${x}px)`, 
                          top: `calc(50% + ${y}px)`,
                          animationDelay: `${index * 0.3}s`
                        }}
                      >
                        <div className="text-2xl mb-1">{component.icon}</div>
                        <div className="text-xs font-semibold">{component.title}</div>
                        
                        {/* Connecting line */}
                        <div 
                          className="absolute w-24 h-px bg-gray-300 origin-left"
                          style={{ 
                            transform: `rotate(${angle * (180/Math.PI)}deg)`,
                            width: `${radius}px`
                          }}
                        >
                          {/* Animated dot on the line */}
                          <div 
                            className="absolute w-1.5 h-1.5 bg-blue-500 rounded-full"
                            style={{
                              animation: 'move-dot 3s linear infinite',
                              animationDelay: `${index * 0.5}s`
                            }}
                          ></div>
                        </div>
                        
                        {/* Tooltip */}
                        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-48">
                          {component.description}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Animation for data processing */}
                <style jsx>{`
                  @keyframes move-dot {
                    0% { left: 0; }
                    50% { left: 100%; }
                    50.001% { left: 100%; opacity: 0; }
                    50.002% { left: 0; opacity: 0; }
                    50.003% { opacity: 1; }
                    100% { left: 0; }
                  }
                `}</style>
              </div>
            </div>
            
            {/* Explanation */}
            <div className={`transition-all duration-1000 delay-500 ${isVisible.aiExplained ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <h3 className="text-2xl font-bold mb-4">How Our Multi-AI System Works</h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold mr-4 mt-1">1</div>
                  <div>
                    <h4 className="font-semibold">Multiple Analysis Perspectives</h4>
                    <p className="text-gray-600">Each AI model and tool analyzes the contract independently, bringing different strengths and focuses.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold mr-4 mt-1">2</div>
                  <div>
                    <h4 className="font-semibold">Finding Collection & Comparison</h4>
                    <p className="text-gray-600">All identified issues are collected and compared to find agreements and disagreements.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold mr-4 mt-1">3</div>
                  <div>
                    <h4 className="font-semibold">AI Discussion & Debate</h4>
                    <p className="text-gray-600">AIs debate findings, challenging each other's conclusions to eliminate false positives.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold mr-4 mt-1">4</div>
                  <div>
                    <h4 className="font-semibold">Consensus & Final Report</h4>
                    <p className="text-gray-600">Final report includes only verified findings with confidence ratings based on AI consensus.</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-700">
                  <strong>Why this matters:</strong> Traditional AI can produce false positives or miss issues. Our multi-AI approach reduces errors by having models check each other's work, similar to how multiple human auditors review code together.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section 
        className="py-20 bg-white"
        id="faq"
        ref={sectionRefs.faq}
      >
        <div className="container">
          <div className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-1000 ${isVisible.faq ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600">
              Everything you need to know about DeFi Watchdog
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            {faq.map((item, index) => (
              <div 
                key={index} 
                className={`mb-5 border border-gray-200 rounded-xl overflow-hidden transition-all duration-500 ${isVisible.faq ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <button
                  className="w-full flex items-center justify-between p-5 bg-white hover:bg-gray-50 transition-colors duration-300 text-left"
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                >
                  <h3 className="text-lg font-semibold pr-8">{item.question}</h3>
                  <svg 
                    className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${activeFaq === index ? 'transform rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <div 
                  className={`overflow-hidden transition-all duration-300 ${activeFaq === index ? 'max-h-96' : 'max-h-0'}`}
                >
                  <div className="p-5 bg-gray-50 border-t border-gray-200">
                    <p className="text-gray-600">{item.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              Ready to Try DeFi Watchdog?
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Analyze your first contract in minutes. No registration required.
            </p>
            
            <Link href="/audit" className="btn px-8 py-4 rounded-lg bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              Start Auditing Now
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}