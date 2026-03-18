// PubNub Content Library — structured catalog of pubnub.com resources
// Used by the content matcher to inject relevant links into AI-generated outreach

export type Vertical =
  | "healthcare"
  | "sports-media"
  | "gaming"
  | "fintech"
  | "ecommerce"
  | "transport-logistics"
  | "igaming"
  | "social"
  | "education"
  | "iot"
  | "ai"
  | "call-center"
  | "streaming"
  | "general";

export type UseCase =
  | "chat"
  | "notifications"
  | "data-streaming"
  | "presence"
  | "geolocation"
  | "iot-messaging"
  | "moderation"
  | "live-events"
  | "collaboration"
  | "telehealth"
  | "delivery-tracking";

export interface ContentItem {
  title: string;
  url: string;
  verticals: Vertical[];
  useCases: UseCase[];
  description: string;
}

export interface ContentLibrary {
  solutions: ContentItem[];
  customerStories: ContentItem[];
  demos: ContentItem[];
  tutorials: ContentItem[];
  ebooks: ContentItem[];
  compliance: ContentItem[];
  blogPosts: ContentItem[];
}

export const PUBNUB_CONTENT: ContentLibrary = {
  solutions: [
    {
      title: "Digital Health",
      url: "https://www.pubnub.com/solutions/digital-health/",
      verticals: ["healthcare"],
      useCases: ["chat", "telehealth", "notifications", "presence"],
      description: "HIPAA-compliant real-time messaging for telehealth, patient monitoring, and care coordination",
    },
    {
      title: "Sports & Media",
      url: "https://www.pubnub.com/solutions/sports-media/",
      verticals: ["sports-media", "streaming"],
      useCases: ["live-events", "chat", "notifications"],
      description: "Fan engagement, live stats, second-screen experiences for sports and media",
    },
    {
      title: "Gaming",
      url: "https://www.pubnub.com/solutions/gaming/",
      verticals: ["gaming"],
      useCases: ["chat", "presence", "notifications", "live-events"],
      description: "In-game chat, matchmaking, leaderboards, and real-time multiplayer features",
    },
    {
      title: "Fintech",
      url: "https://www.pubnub.com/solutions/fintech/",
      verticals: ["fintech"],
      useCases: ["data-streaming", "notifications", "chat"],
      description: "Real-time market data, transaction alerts, and secure in-app messaging for financial services",
    },
    {
      title: "eCommerce",
      url: "https://www.pubnub.com/solutions/ecommerce/",
      verticals: ["ecommerce"],
      useCases: ["chat", "notifications", "live-events"],
      description: "Live shopping, inventory updates, customer support chat, and order tracking",
    },
    {
      title: "Transport & Delivery",
      url: "https://www.pubnub.com/solutions/transport-delivery/",
      verticals: ["transport-logistics"],
      useCases: ["geolocation", "delivery-tracking", "iot-messaging", "notifications"],
      description: "Real-time fleet tracking, delivery updates, driver-customer communication",
    },
    {
      title: "Call Center Automation",
      url: "https://www.pubnub.com/solutions/call-center-automation/",
      verticals: ["call-center"],
      useCases: ["chat", "presence", "notifications"],
      description: "Agent-customer messaging, queue management, real-time routing for contact centers",
    },
    {
      title: "iGaming, Betting & Casino",
      url: "https://www.pubnub.com/solutions/igaming-betting-casino/",
      verticals: ["igaming"],
      useCases: ["live-events", "chat", "data-streaming", "notifications"],
      description: "Live odds, in-play betting, social features, and real-time game state for iGaming",
    },
    {
      title: "Chat",
      url: "https://www.pubnub.com/solutions/chat/",
      verticals: ["general"],
      useCases: ["chat", "moderation", "presence"],
      description: "Full-featured in-app chat with typing indicators, read receipts, and moderation",
    },
    {
      title: "Social & Lifestyle",
      url: "https://www.pubnub.com/solutions/social/",
      verticals: ["social"],
      useCases: ["chat", "live-events", "notifications", "presence"],
      description: "Social feeds, messaging, community features, and live interactions",
    },
    {
      title: "Geolocation",
      url: "https://www.pubnub.com/solutions/geolocation/",
      verticals: ["transport-logistics", "general"],
      useCases: ["geolocation", "delivery-tracking"],
      description: "Real-time location tracking, geofencing, and proximity-based features",
    },
    {
      title: "Data Streaming",
      url: "https://www.pubnub.com/solutions/data-streaming/",
      verticals: ["general", "iot", "fintech"],
      useCases: ["data-streaming", "iot-messaging"],
      description: "High-throughput, low-latency data streaming for IoT, dashboards, and analytics",
    },
    {
      title: "AI Moderation",
      url: "https://www.pubnub.com/solutions/ai-moderation/",
      verticals: ["general", "social", "gaming"],
      useCases: ["moderation", "chat"],
      description: "AI-powered content moderation for real-time chat and community safety",
    },
  ],

  customerStories: [
    {
      title: "DAZN",
      url: "https://www.pubnub.com/customers/dazn/",
      verticals: ["sports-media", "streaming"],
      useCases: ["live-events", "chat"],
      description: "Global sports streaming platform uses PubNub for live fan engagement",
    },
    {
      title: "LiveLike",
      url: "https://www.pubnub.com/customers/livelike/",
      verticals: ["sports-media", "streaming"],
      useCases: ["live-events", "chat"],
      description: "Fan engagement platform powering interactive sports experiences",
    },
    {
      title: "Veeps (Live Nation)",
      url: "https://www.pubnub.com/customers/veeps/",
      verticals: ["sports-media", "streaming"],
      useCases: ["live-events", "chat"],
      description: "Live Nation's livestreaming platform for concerts and events",
    },
    {
      title: "17LIVE",
      url: "https://www.pubnub.com/customers/17live/",
      verticals: ["streaming", "social"],
      useCases: ["live-events", "chat"],
      description: "Asia's leading live streaming platform with real-time audience interaction",
    },
    {
      title: "Clubhouse",
      url: "https://www.pubnub.com/customers/clubhouse/",
      verticals: ["social"],
      useCases: ["chat", "presence", "notifications"],
      description: "Audio social network uses PubNub for real-time messaging and presence",
    },
    {
      title: "ClassDojo",
      url: "https://www.pubnub.com/customers/classdojo/",
      verticals: ["education"],
      useCases: ["chat", "notifications"],
      description: "EdTech platform connecting teachers, students, and parents in real time",
    },
    {
      title: "Beamable",
      url: "https://www.pubnub.com/customers/beamable/",
      verticals: ["gaming"],
      useCases: ["chat", "live-events"],
      description: "Gaming backend platform powering real-time multiplayer features",
    },
    {
      title: "Gameloft",
      url: "https://www.pubnub.com/customers/gameloft/",
      verticals: ["gaming"],
      useCases: ["chat", "presence"],
      description: "Major game publisher using PubNub for in-game chat and social features",
    },
    {
      title: "Pocket Gems",
      url: "https://www.pubnub.com/customers/pocket-gems/",
      verticals: ["gaming"],
      useCases: ["chat", "live-events"],
      description: "Mobile game studio with millions of users relying on PubNub for real-time features",
    },
    {
      title: "Hearo",
      url: "https://www.pubnub.com/customers/hearo/",
      verticals: ["healthcare", "iot"],
      useCases: ["iot-messaging", "notifications"],
      description: "IoT health monitoring platform using PubNub for device-to-cloud communication",
    },
    {
      title: "NurseGrid",
      url: "https://www.pubnub.com/customers/nursegrid/",
      verticals: ["healthcare"],
      useCases: ["chat", "notifications"],
      description: "Healthcare scheduling and communication platform for nurses",
    },
    {
      title: "ManaDr",
      url: "https://www.pubnub.com/customers/manadr-mobile-health/",
      verticals: ["healthcare"],
      useCases: ["telehealth", "chat"],
      description: "Mobile health platform using PubNub for real-time doctor-patient consultations",
    },
    {
      title: "Kustomer",
      url: "https://www.pubnub.com/customers/kustomer/",
      verticals: ["call-center"],
      useCases: ["chat", "presence"],
      description: "Customer service platform using PubNub for real-time agent-customer messaging",
    },
    {
      title: "EliseAI",
      url: "https://www.pubnub.com/customers/eliseai/",
      verticals: ["ai"],
      useCases: ["chat", "notifications"],
      description: "AI-powered customer communication platform for property management",
    },
    {
      title: "Swiggy",
      url: "https://www.pubnub.com/customers/swiggy/",
      verticals: ["transport-logistics", "ecommerce"],
      useCases: ["delivery-tracking", "geolocation", "notifications"],
      description: "India's leading food delivery platform using PubNub for real-time order tracking",
    },
    {
      title: "Mothership",
      url: "https://www.pubnub.com/customers/mothership/",
      verticals: ["transport-logistics"],
      useCases: ["delivery-tracking", "geolocation"],
      description: "Freight logistics platform using PubNub for real-time shipment tracking",
    },
    {
      title: "Tenna",
      url: "https://www.pubnub.com/customers/tenna-powers-real-time-visibility-for-construction-companies/",
      verticals: ["transport-logistics", "iot"],
      useCases: ["iot-messaging", "geolocation"],
      description: "Construction equipment tracking platform with real-time asset visibility",
    },
    {
      title: "Decisiv",
      url: "https://www.pubnub.com/customers/transport-logistics-decisiv/",
      verticals: ["transport-logistics"],
      useCases: ["data-streaming", "notifications"],
      description: "Fleet management and service platform for commercial vehicles",
    },
    {
      title: "Zoomy",
      url: "https://www.pubnub.com/customers/zoomy/",
      verticals: ["transport-logistics"],
      useCases: ["geolocation", "delivery-tracking"],
      description: "Ride-hailing platform using PubNub for real-time driver-rider communication",
    },
    {
      title: "BusWhere",
      url: "https://www.pubnub.com/customers/buswhere-helps-kids-get-to-the-bus-on-time-with-pubnub/",
      verticals: ["transport-logistics", "education"],
      useCases: ["geolocation", "notifications"],
      description: "School bus tracking app helping parents know exactly when the bus arrives",
    },
    {
      title: "Logitech",
      url: "https://www.pubnub.com/customers/logitech/",
      verticals: ["iot"],
      useCases: ["iot-messaging", "data-streaming"],
      description: "Hardware giant using PubNub for IoT device communication",
    },
    {
      title: "Climate LLC",
      url: "https://www.pubnub.com/customers/climate-llc/",
      verticals: ["iot"],
      useCases: ["iot-messaging", "data-streaming"],
      description: "Agricultural technology company using PubNub for real-time farm data streaming",
    },
    {
      title: "FanHub",
      url: "https://www.pubnub.com/customers/fanhub/",
      verticals: ["sports-media"],
      useCases: ["live-events", "chat"],
      description: "Fan prediction platform driving engagement during live sporting events",
    },
    {
      title: "Stage Ten",
      url: "https://www.pubnub.com/customers/stage-ten/",
      verticals: ["streaming"],
      useCases: ["live-events", "chat"],
      description: "Interactive live streaming production platform",
    },
    {
      title: "CrowdComfort",
      url: "https://www.pubnub.com/customers/crowdcomfort/",
      verticals: ["iot"],
      useCases: ["iot-messaging", "notifications"],
      description: "Smart building platform using PubNub for real-time facility management",
    },
    {
      title: "Ayoa",
      url: "https://www.pubnub.com/customers/ayoa/",
      verticals: ["general"],
      useCases: ["collaboration", "chat"],
      description: "Productivity and collaboration platform with real-time whiteboarding",
    },
    {
      title: "OneCall",
      url: "https://www.pubnub.com/customers/one-call-relayride/",
      verticals: ["healthcare", "transport-logistics"],
      useCases: ["notifications", "geolocation"],
      description: "Healthcare transportation coordination platform",
    },
  ],

  demos: [
    {
      title: "Group Chat (React)",
      url: "https://www.pubnub.com/demos/group-chat-react-demo/",
      verticals: ["general"],
      useCases: ["chat"],
      description: "Interactive React group chat demo with typing indicators and read receipts",
    },
    {
      title: "Full-Featured Chat",
      url: "https://www.pubnub.com/demos/chat/",
      verticals: ["general"],
      useCases: ["chat", "presence", "moderation"],
      description: "Production-ready chat demo with threads, reactions, and moderation",
    },
    {
      title: "Delivery Tracking",
      url: "https://www.pubnub.com/demos/delivery/",
      verticals: ["transport-logistics", "ecommerce"],
      useCases: ["delivery-tracking", "geolocation"],
      description: "Real-time delivery tracking dashboard with live map updates",
    },
    {
      title: "Geolocation",
      url: "https://www.pubnub.com/demos/geolocation-demo/",
      verticals: ["transport-logistics", "general"],
      useCases: ["geolocation"],
      description: "Live location tracking demo showing multiple moving assets on a map",
    },
    {
      title: "Telehealth",
      url: "https://www.pubnub.com/demos/telehealth/",
      verticals: ["healthcare"],
      useCases: ["telehealth", "chat"],
      description: "Doctor-patient video and chat telehealth demo",
    },
    {
      title: "Transport & Logistics",
      url: "https://www.pubnub.com/demos/transport-logistics/",
      verticals: ["transport-logistics"],
      useCases: ["geolocation", "delivery-tracking", "data-streaming"],
      description: "Fleet management dashboard with real-time vehicle tracking and status",
    },
    {
      title: "Live Streaming Showcase",
      url: "https://www.pubnub.com/demos/live-streaming-showcase/",
      verticals: ["streaming", "sports-media"],
      useCases: ["live-events", "chat"],
      description: "Interactive live stream with real-time chat and audience engagement",
    },
    {
      title: "Real-Time Data Streaming",
      url: "https://www.pubnub.com/demos/real-time-data-streaming/",
      verticals: ["general", "fintech", "iot"],
      useCases: ["data-streaming"],
      description: "High-throughput data visualization with live streaming charts",
    },
    {
      title: "Live Auction (Red5)",
      url: "https://www.pubnub.com/demos/red5-auction/",
      verticals: ["ecommerce", "streaming"],
      useCases: ["live-events"],
      description: "Real-time bidding and auction platform with live video",
    },
    {
      title: "Flutter Chat",
      url: "https://www.pubnub.com/demos/flutter-chat/",
      verticals: ["general"],
      useCases: ["chat"],
      description: "Cross-platform chat demo built with Flutter and PubNub",
    },
    {
      title: "Mobile Chat SDK",
      url: "https://www.pubnub.com/demos/chat-sdk-mobile/",
      verticals: ["general"],
      useCases: ["chat"],
      description: "Native mobile chat SDK demo for iOS and Android",
    },
    {
      title: "10-Line Chat",
      url: "https://www.pubnub.com/demos/10-line-chat/",
      verticals: ["general"],
      useCases: ["chat"],
      description: "Minimal chat implementation showing PubNub's simplicity — just 10 lines of code",
    },
    {
      title: "Codoodler (Collaboration)",
      url: "https://www.pubnub.com/demos/codoodler-collaboration-demo/",
      verticals: ["general"],
      useCases: ["collaboration"],
      description: "Real-time collaborative drawing app demonstrating low-latency sync",
    },
  ],

  tutorials: [
    {
      title: "Chat SDK Tutorial",
      url: "https://www.pubnub.com/tutorials/chat-sdk/",
      verticals: ["general"],
      useCases: ["chat"],
      description: "Build a full-featured chat app in 50 minutes with PubNub Chat SDK",
    },
    {
      title: "IoT Dashboard Tutorial",
      url: "https://www.pubnub.com/tutorials/iot-dashboard/",
      verticals: ["iot"],
      useCases: ["iot-messaging", "data-streaming"],
      description: "Build a real-time IoT monitoring dashboard in 30 minutes",
    },
    {
      title: "Delivery Application Tutorial",
      url: "https://www.pubnub.com/tutorials/delivery-application/",
      verticals: ["transport-logistics", "ecommerce"],
      useCases: ["delivery-tracking", "geolocation"],
      description: "Build a delivery tracking app with live location updates in 25 minutes",
    },
    {
      title: "Collaboration App Tutorial",
      url: "https://www.pubnub.com/tutorials/collaboration/",
      verticals: ["general"],
      useCases: ["collaboration"],
      description: "Build a real-time collaborative app in 20 minutes",
    },
    {
      title: "Condition Monitoring Tutorial",
      url: "https://www.pubnub.com/tutorials/condition-dashboard/",
      verticals: ["iot"],
      useCases: ["iot-messaging", "data-streaming"],
      description: "Build a condition monitoring dashboard for IoT sensors in 1 hour",
    },
    {
      title: "Real-Time Data Streaming Tutorial",
      url: "https://www.pubnub.com/tutorials/real-time-data-streaming/",
      verticals: ["general", "fintech"],
      useCases: ["data-streaming"],
      description: "Build a real-time data streaming visualization in 15 minutes",
    },
    {
      title: "Geolocation Tracker Tutorial",
      url: "https://www.pubnub.com/tutorials/geolocation-tracker/",
      verticals: ["transport-logistics"],
      useCases: ["geolocation"],
      description: "Build a real-time geolocation tracker in 25 minutes",
    },
    {
      title: "Live Auction / Marketplace Tutorial",
      url: "https://www.pubnub.com/tutorials/marketplace-auction-bidding-app/",
      verticals: ["ecommerce"],
      useCases: ["live-events"],
      description: "Build a live auction and bidding app in 20 minutes",
    },
    {
      title: "Mobile Push Notifications Tutorial",
      url: "https://www.pubnub.com/tutorials/mobile-push-notifications/",
      verticals: ["general"],
      useCases: ["notifications"],
      description: "Implement mobile push notifications with PubNub",
    },
  ],

  ebooks: [
    {
      title: "The Ultimate Guide to Fan Engagement & Monetization",
      url: "https://www.pubnub.com/resources/ebook/the-ultimate-guide-to-fan-engagement-monetization/",
      verticals: ["sports-media"],
      useCases: ["live-events"],
      description: "Guide to driving fan engagement and revenue through real-time interactivity",
    },
    {
      title: "The Ultimate Guide to Chat Moderation",
      url: "https://www.pubnub.com/resources/ebook/the-ultimate-guide-to-chat-moderation/",
      verticals: ["general", "social", "gaming"],
      useCases: ["moderation", "chat"],
      description: "Comprehensive guide to moderating real-time chat at scale",
    },
    {
      title: "The Interactive Streaming Playbook",
      url: "https://www.pubnub.com/resources/ebook/the-interactive-streaming-playbook/",
      verticals: ["streaming", "sports-media"],
      useCases: ["live-events"],
      description: "Playbook for building interactive streaming experiences",
    },
    {
      title: "The Definitive Guide to Reliable Gaming Apps",
      url: "https://www.pubnub.com/resources/ebook/the-definitive-guide-to-creating-a-reliable-gaming-app/",
      verticals: ["gaming"],
      useCases: ["chat", "presence"],
      description: "Guide to building reliable, scalable real-time gaming applications",
    },
    {
      title: "Gaming Innovators Rely on PubNub",
      url: "https://www.pubnub.com/resources/ebook/gaming-innovators-rely-on-pubnub/",
      verticals: ["gaming"],
      useCases: ["chat", "live-events"],
      description: "Case studies from gaming companies using PubNub",
    },
    {
      title: "Healthcare Innovators Rely on PubNub",
      url: "https://www.pubnub.com/resources/ebook/healthare-innovators-rely-on-pubnub/",
      verticals: ["healthcare"],
      useCases: ["telehealth", "chat"],
      description: "Case studies from healthcare companies using PubNub for HIPAA-compliant communication",
    },
    {
      title: "Real-Time Visibility in Supply Chains",
      url: "https://www.pubnub.com/resources/ebook/real-time-visibility-and-supply-chain-resilience/",
      verticals: ["transport-logistics"],
      useCases: ["delivery-tracking", "iot-messaging"],
      description: "Guide to achieving real-time supply chain visibility and resilience",
    },
    {
      title: "Why Time is Everything for Businesses",
      url: "https://www.pubnub.com/resources/ebook/why-time-is-everything-for-businesses/",
      verticals: ["general"],
      useCases: ["data-streaming"],
      description: "Business case for real-time data in enterprise operations",
    },
    {
      title: "How to Become a Superhero with PubNub",
      url: "https://www.pubnub.com/resources/ebook/how-to-become-a-superhero-with-pubnub/",
      verticals: ["general"],
      useCases: ["chat", "data-streaming"],
      description: "Developer-focused guide to building powerful real-time features quickly",
    },
  ],

  compliance: [
    {
      title: "HIPAA Compliance",
      url: "https://www.pubnub.com/trust/compliance/hipaa/",
      verticals: ["healthcare"],
      useCases: ["chat", "telehealth"],
      description: "PubNub's HIPAA compliance for healthcare and protected health information",
    },
    {
      title: "SOC 2 Type II",
      url: "https://www.pubnub.com/trust/compliance/soc2/",
      verticals: ["general", "fintech"],
      useCases: [],
      description: "SOC 2 Type II certification for security, availability, and confidentiality",
    },
    {
      title: "ISO 27001",
      url: "https://www.pubnub.com/trust/compliance/iso-27001/",
      verticals: ["general"],
      useCases: [],
      description: "ISO 27001 information security management certification",
    },
    {
      title: "Data Privacy Framework (EU-US)",
      url: "https://www.pubnub.com/trust/compliance/data-privacy-framework/",
      verticals: ["general"],
      useCases: [],
      description: "EU-US Data Privacy Framework compliance for cross-border data transfers",
    },
    {
      title: "Trust Center",
      url: "https://www.pubnub.com/trust/",
      verticals: ["general"],
      useCases: [],
      description: "PubNub's trust center — security, compliance, and privacy overview",
    },
    {
      title: "Security",
      url: "https://www.pubnub.com/trust/security/",
      verticals: ["general"],
      useCases: [],
      description: "TLS + AES-256 encryption, access management, and security architecture",
    },
  ],

  blogPosts: [
    {
      title: "How to Build a Real-Time Patient Monitoring System",
      url: "https://www.pubnub.com/blog/how-to-build-a-real-time-patient-monitoring-system/",
      verticals: ["healthcare"],
      useCases: ["iot-messaging", "data-streaming"],
      description: "Technical guide for building real-time patient monitoring with PubNub",
    },
    {
      title: "Real-Time Alerts Improve Patient Engagement",
      url: "https://www.pubnub.com/blog/how-real-time-alerts-improve-patient-engagement-and-treatment-adherence/",
      verticals: ["healthcare"],
      useCases: ["notifications", "telehealth"],
      description: "How real-time alerts drive better patient outcomes and engagement",
    },
    {
      title: "HIPAA-Compliant Chat",
      url: "https://www.pubnub.com/blog/hipaa-compliant-chat/",
      verticals: ["healthcare"],
      useCases: ["chat", "telehealth"],
      description: "Building HIPAA-compliant chat for healthcare applications",
    },
    {
      title: "Track Doctor-Patient Presence",
      url: "https://www.pubnub.com/blog/track-doctor-patient-presence-for-efficient-online-consultations/",
      verticals: ["healthcare"],
      useCases: ["presence", "telehealth"],
      description: "Using presence detection for efficient online consultations",
    },
    {
      title: "Boost Engagement with Second-Screen Experiences",
      url: "https://www.pubnub.com/blog/boost-engagement-with-second-screen-experiences/",
      verticals: ["sports-media", "streaming"],
      useCases: ["live-events"],
      description: "How second-screen experiences drive viewer engagement during live events",
    },
    {
      title: "Gamifying Your Application with Real-Time Interactivity",
      url: "https://www.pubnub.com/blog/gamifying-your-application-with-real-time-interactivity/",
      verticals: ["gaming", "general"],
      useCases: ["live-events", "chat"],
      description: "Adding gamification elements using real-time features",
    },
    {
      title: "Personalized Content, Promotions and Rewards",
      url: "https://www.pubnub.com/blog/deliver-personalized-content-promotions-and-rewards-tailored-to-your-audience/",
      verticals: ["sports-media", "ecommerce"],
      useCases: ["notifications", "live-events"],
      description: "Delivering personalized real-time promotions to your audience",
    },
    {
      title: "Enhancing Live Chat Moderation with AI",
      url: "https://www.pubnub.com/blog/enhancing-live-chat-moderation-with-ai/",
      verticals: ["general", "social", "gaming"],
      useCases: ["moderation", "chat"],
      description: "How AI-powered moderation keeps real-time chat safe at scale",
    },
    {
      title: "Optimize Digital Transactions in Real-Time",
      url: "https://www.pubnub.com/blog/optimize-and-process-millions-of-digital-transactions-in-real-time-for-digital-commerce-platforms/",
      verticals: ["ecommerce", "fintech"],
      useCases: ["data-streaming"],
      description: "Processing millions of real-time transactions for digital commerce platforms",
    },
    {
      title: "Real-Time Streaming with Red5",
      url: "https://www.pubnub.com/blog/every-millisecond-is-a-business-model-new-opportunities-in-real-time-streaming-with-red-5/",
      verticals: ["streaming"],
      useCases: ["live-events"],
      description: "New business models enabled by low-latency real-time streaming",
    },
    {
      title: "Add Real-Time Features to Customer Care Chat",
      url: "https://www.pubnub.com/blog/add-real-time-features-to-your-customer-care-chat/",
      verticals: ["call-center"],
      useCases: ["chat", "presence"],
      description: "Enhancing customer care chat with real-time features",
    },
    {
      title: "SOC 3 Compliance",
      url: "https://www.pubnub.com/blog/compliance-built-in-pubnub-achieves-soc-3-compliance/",
      verticals: ["general", "fintech"],
      useCases: [],
      description: "PubNub's SOC 3 compliance achievement for enterprise trust",
    },
    {
      title: "Build a Watch Party Sync Demo",
      url: "https://www.pubnub.com/blog/build-a-watch-party-sync-demo-with-shaka-player-and-pubnub/",
      verticals: ["streaming", "sports-media"],
      useCases: ["live-events"],
      description: "Building synchronized watch party experiences with PubNub",
    },
    {
      title: "PubNub Agent Skills for AI Development",
      url: "https://www.pubnub.com/blog/pub-nub-agent-skills-accelerate-ai-development-with-real-time-intelligence/",
      verticals: ["ai"],
      useCases: ["data-streaming"],
      description: "Accelerating AI development with PubNub's real-time intelligence capabilities",
    },
    {
      title: "PubNub on n8n for Workflow Automation",
      url: "https://www.pubnub.com/blog/pub-nub-is-now-on-n-8-n-bringing-real-time-workflow-automation-to-over-1-billion-connected-devices/",
      verticals: ["iot", "general"],
      useCases: ["iot-messaging", "data-streaming"],
      description: "Real-time workflow automation integration with n8n for IoT devices",
    },
  ],
};
