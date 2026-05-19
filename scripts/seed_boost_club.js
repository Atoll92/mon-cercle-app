#!/usr/bin/env node
// Script to populate Boost Club demo network with realistic data
// Usage: node scripts/seed_boost_club.js

const SUPABASE_URL = 'https://etoxvocwsktguoddmgcu.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0b3h2b2N3c2t0Z3VvZGRtZ2N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDM3Mjg0MSwiZXhwIjoyMDU5OTQ4ODQxfQ.uQNujoK7bcmu1xknCTrHTp1LeRYZza_lPNM4t3RXwWo';
const BOOST_ID = '56c79ae7-9866-4e0e-93fa-bfb79f287220';

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal'
};

// ============================================================
// REALISTIC DEMO MEMBERS (diverse European names)
// ============================================================
const DEMO_MEMBERS = [
  { name: "Sophie Laurent", bio: "Graphic designer & brand strategist based in Lyon. Passionate about sustainable design and local craftsmanship.", skills: ["Brand Design", "Illustration", "Sustainability"], linkedin: "https://linkedin.com/in/sophielaurent" },
  { name: "Marco Bianchi", bio: "Full-stack developer from Milan. Building tools for community-driven projects. Open source enthusiast.", skills: ["React", "Node.js", "PostgreSQL"], linkedin: "https://linkedin.com/in/marcobianchi" },
  { name: "Elena Vasquez", bio: "Community organizer and event planner in Barcelona. Connecting people through shared experiences.", skills: ["Event Planning", "Community Building", "Social Media"], linkedin: "https://linkedin.com/in/elenavasquez" },
  { name: "Thomas Müller", bio: "Environmental consultant in Berlin. Helping organizations measure and reduce their carbon footprint.", skills: ["Sustainability", "Data Analysis", "Consulting"], linkedin: "https://linkedin.com/in/thomasmuller" },
  { name: "Clara Dubois", bio: "Freelance photographer specializing in documentary and street photography. Based in Paris.", skills: ["Photography", "Lightroom", "Storytelling"], linkedin: "https://linkedin.com/in/claradubois" },
  { name: "Liam O'Brien", bio: "Product manager at a Dublin-based startup. Focused on user experience and community-first products.", skills: ["Product Management", "UX Research", "Agile"], linkedin: "https://linkedin.com/in/liamobrien" },
  { name: "Annika Johansson", bio: "UX researcher from Stockholm. Fascinated by how people interact in digital communities.", skills: ["UX Research", "Figma", "User Testing"], linkedin: "https://linkedin.com/in/annikajohansson" },
  { name: "Pierre Moreau", bio: "Cooperative founder and social entrepreneur in Toulouse. Building the solidarity economy.", skills: ["Cooperative Management", "Finance", "Leadership"], linkedin: "https://linkedin.com/in/pierremoreau" },
  { name: "Katarina Novak", bio: "Marketing consultant from Prague. Helping small businesses find their voice online.", skills: ["Digital Marketing", "SEO", "Content Strategy"], linkedin: "https://linkedin.com/in/katarinanovak" },
  { name: "Hugo Fernandes", bio: "Data scientist in Lisbon. Using AI to solve real-world problems, not create new ones.", skills: ["Python", "Machine Learning", "Data Visualization"], linkedin: "https://linkedin.com/in/hugofernandes" },
  { name: "Isabelle Martin", bio: "Independent journalist covering tech, privacy, and digital rights in Brussels.", skills: ["Journalism", "Research", "Digital Rights"], linkedin: "https://linkedin.com/in/isabellemartin" },
  { name: "Jan de Vries", bio: "Architect and urban planner in Amsterdam. Designing spaces that bring people together.", skills: ["Architecture", "Urban Planning", "3D Modeling"], linkedin: "https://linkedin.com/in/jandevries" },
  { name: "Marta Kowalska", bio: "Teacher and education innovator from Warsaw. Making learning accessible and fun.", skills: ["Education", "Curriculum Design", "EdTech"], linkedin: "https://linkedin.com/in/martakowalska" },
  { name: "Felix Braun", bio: "Craft brewer and food entrepreneur in Vienna. Community over competition.", skills: ["Brewing", "Food Science", "Entrepreneurship"], linkedin: "https://linkedin.com/in/felixbraun" },
  { name: "Chiara Romano", bio: "Non-profit program director in Rome. 10 years of experience in international development.", skills: ["Program Management", "Fundraising", "Impact Evaluation"], linkedin: "https://linkedin.com/in/chiararomano" },
  { name: "Lucas Perrin", bio: "Video producer and content creator in Marseille. Telling stories that matter.", skills: ["Video Production", "Premiere Pro", "Motion Graphics"], linkedin: "https://linkedin.com/in/lucasperrin" },
  { name: "Nadia Bergström", bio: "Sustainability consultant in Gothenburg. Helping companies transition to circular economy models.", skills: ["Circular Economy", "ESG Reporting", "Strategy"], linkedin: "https://linkedin.com/in/nadiabergstrom" },
  { name: "Romain Girard", bio: "Full-stack developer and open source contributor from Nantes. Privacy-first always.", skills: ["TypeScript", "Rust", "DevOps"], linkedin: "https://linkedin.com/in/romaingirard" },
  { name: "Emma Fischer", bio: "Psychologist and team coach in Zurich. Helping remote teams thrive together.", skills: ["Coaching", "Psychology", "Team Dynamics"], linkedin: "https://linkedin.com/in/emmafischer" },
  { name: "Alejandro Ruiz", bio: "Industrial designer and maker from Valencia. Physical products for a digital world.", skills: ["Industrial Design", "3D Printing", "CAD"], linkedin: "https://linkedin.com/in/alejandroruiz" },
  { name: "Marie Lefèvre", bio: "Yoga teacher and wellness coach in Bordeaux. Building mindful communities online and offline.", skills: ["Yoga", "Wellness", "Community Building"], linkedin: "https://linkedin.com/in/marielefevre" },
  { name: "Oscar Nielsen", bio: "Backend engineer at a Copenhagen fintech. Building reliable systems for people.", skills: ["Go", "Kubernetes", "System Design"], linkedin: "https://linkedin.com/in/oscarnielsen" },
  { name: "Giulia Conti", bio: "Art curator and gallery owner in Florence. Supporting emerging European artists.", skills: ["Art Curation", "Gallery Management", "Art History"], linkedin: "https://linkedin.com/in/giuliaconti" },
  { name: "Stefan Popescu", bio: "Cybersecurity analyst in Bucharest. Privacy advocate and digital safety trainer.", skills: ["Cybersecurity", "Privacy", "Penetration Testing"], linkedin: "https://linkedin.com/in/stefanpopescu" },
  { name: "Agathe Renaud", bio: "Social worker and community advocate in Strasbourg. Fighting for equity in access to technology.", skills: ["Social Work", "Advocacy", "Policy"], linkedin: "https://linkedin.com/in/agathelenaud" },
  { name: "Henrik Larsen", bio: "Wind energy engineer in Copenhagen. Working on Europe's clean energy transition.", skills: ["Renewable Energy", "Engineering", "Project Management"], linkedin: "https://linkedin.com/in/henriklarsen" },
  { name: "Camille Petit", bio: "Illustrator and children's book author. Based in a tiny village in Provence.", skills: ["Illustration", "Writing", "Procreate"], linkedin: "https://linkedin.com/in/camillepetit" },
  { name: "Lukas Weber", bio: "Startup mentor and angel investor in Munich. Backing founders who care about impact.", skills: ["Investing", "Mentorship", "Business Strategy"], linkedin: "https://linkedin.com/in/lukasweber" },
  { name: "Sara Lindqvist", bio: "Climate scientist at a research institute in Helsinki. Communicating urgency through data.", skills: ["Climate Science", "R", "Science Communication"], linkedin: "https://linkedin.com/in/saralindqvist" },
  { name: "Antoine Blanc", bio: "Chef and food writer in Lyon. Exploring the intersection of tradition and innovation.", skills: ["Culinary Arts", "Food Writing", "Recipe Development"], linkedin: "https://linkedin.com/in/antoineblanc" },
  { name: "Eva Szabo", bio: "Translator and language teacher in Budapest. Bridging cultures one word at a time.", skills: ["Translation", "Language Teaching", "Localization"], linkedin: "https://linkedin.com/in/evaszabo" },
  { name: "Matteo Ricci", bio: "Mobile developer building apps for local communities in Turin. Co-op model advocate.", skills: ["Flutter", "iOS", "Android"], linkedin: "https://linkedin.com/in/matteoricci" },
  { name: "Léa Fournier", bio: "Project manager at an impact-driven agency in Paris. Making organizations more human.", skills: ["Project Management", "Agile", "Change Management"], linkedin: "https://linkedin.com/in/leafournier" },
  { name: "Viktor Horváth", bio: "Filmmaker and visual artist from Budapest. Exploring identity and belonging.", skills: ["Filmmaking", "Visual Arts", "Editing"], linkedin: "https://linkedin.com/in/viktorhorvath" },
  { name: "Julie Bertrand", bio: "Front-end developer and accessibility advocate in Lille. The web is for everyone.", skills: ["React", "Accessibility", "CSS"], linkedin: "https://linkedin.com/in/juliebertrand" },
  { name: "Nikolai Ivanov", bio: "Mechanical engineer and DIY enthusiast. Building community workshops in Tallinn.", skills: ["Mechanical Engineering", "Maker Spaces", "CNC"], linkedin: "https://linkedin.com/in/nikolaiivanov" },
  { name: "Margaux Leroy", bio: "Brand consultant helping European startups stand out. Based between Paris and Berlin.", skills: ["Branding", "Strategy", "Visual Identity"], linkedin: "https://linkedin.com/in/margauxleroy" },
  { name: "Tomas Kral", bio: "Backend developer and privacy activist from Bratislava. FOSS contributor.", skills: ["Python", "Linux", "Privacy Tech"], linkedin: "https://linkedin.com/in/tomaskral" },
  { name: "Hélène Costa", bio: "Photographer and cultural event organizer in Montpellier. Capturing community moments.", skills: ["Photography", "Event Organization", "Social Media"], linkedin: "https://linkedin.com/in/helenecosta" },
  { name: "Andreas Papadopoulos", bio: "Agricultural engineer promoting regenerative farming in Crete. Soil health advocate.", skills: ["Agriculture", "Sustainability", "Soil Science"], linkedin: "https://linkedin.com/in/andreaspapadopoulos" },
];

// Avatar URLs that work online — using pravatar.cc for realistic face photos
// pravatar.cc has 70 unique faces (img=1 to img=70)
function getAvatarUrl(name, index) {
  const imgId = (index % 70) + 1;
  return `https://i.pravatar.cc/200?img=${imgId}`;
}

// ============================================================
// DEMO NEWS POSTS
// ============================================================
const DEMO_NEWS = [
  {
    title: "Welcome to Boost Club!",
    content: `<p>Welcome to <strong>Boost Club</strong>, a community of European creators, entrepreneurs, and professionals who believe in building meaningful connections without Big Tech.</p>
<p>Here's what you can do:</p>
<ul>
<li><strong>Share your work</strong> in your portfolio</li>
<li><strong>Join events</strong> and meetups organized by members</li>
<li><strong>Collaborate</strong> through our wiki and shared files</li>
<li><strong>Chat</strong> in real-time with other members</li>
</ul>
<p>This is your space. No ads, no tracking, no algorithm. Just people helping people.</p>`,
    is_pinned: true,
    daysAgo: 45
  },
  {
    title: "Community Roundtable: What tools do you use daily?",
    content: `<p>Let's share what's in our toolboxes! I'll start:</p>
<ul>
<li><strong>Design:</strong> Figma + Penpot for open-source alternative</li>
<li><strong>Communication:</strong> This platform (of course!) + Signal for quick chats</li>
<li><strong>Project management:</strong> Todoist + Notion</li>
<li><strong>Code:</strong> VS Code, GitHub</li>
</ul>
<p>What about you? Any hidden gems you'd like to recommend to the community?</p>`,
    is_pinned: false,
    daysAgo: 30
  },
  {
    title: "Monthly Spotlight: Chiara's non-profit impact report",
    content: `<p>This month we're highlighting <strong>Chiara Romano</strong>'s incredible work with her non-profit in Rome.</p>
<p>Key achievements this quarter:</p>
<ul>
<li>3 new community programs launched</li>
<li>150+ beneficiaries reached</li>
<li>Partnership with 2 local universities</li>
</ul>
<p>Chiara has been an active member since day one and her dedication to social impact is truly inspiring. Congratulations!</p>`,
    is_pinned: false,
    daysAgo: 15
  },
  {
    title: "GDPR Workshop Recap — Key Takeaways",
    content: `<p>Thanks to everyone who joined last week's online workshop on <strong>GDPR best practices for small organizations</strong>.</p>
<p>Here are the key takeaways:</p>
<ol>
<li>You don't need a DPO if you have fewer than 250 employees</li>
<li>Cookie consent must be freely given — no dark patterns</li>
<li>Data minimization: only collect what you actually need</li>
<li>Right to erasure applies to backups too (with reasonable timelines)</li>
</ol>
<p>Stefan recorded the session — check the Files section for the recording and slides.</p>`,
    is_pinned: false,
    daysAgo: 7
  },
  {
    title: "Looking for collaborators: EU Makers Directory",
    content: `<p>I'm working on an open directory of European makers, artisans, and independent producers. The goal is to make it easy to find and support local talent across Europe.</p>
<p>Looking for help with:</p>
<ul>
<li>Web development (Next.js / React)</li>
<li>Data collection and verification</li>
<li>Translation (we need at least 5 EU languages)</li>
<li>Design and UX</li>
</ul>
<p>If you're interested, drop a comment or send me a DM. This is a volunteer project — no budget yet, but lots of passion!</p>`,
    is_pinned: false,
    daysAgo: 3
  }
];

// ============================================================
// DEMO EVENTS
// ============================================================
const DEMO_EVENTS = [
  {
    title: "Monthly Virtual Coffee",
    description: "Casual monthly meetup where members share what they've been working on. No agenda, just good conversations. Bring your coffee!",
    location: "Online (Jitsi)",
    daysFromNow: 5,
    duration: 60
  },
  {
    title: "Design Thinking Workshop",
    description: "Hands-on workshop led by Annika on applying design thinking methods to community projects. Open to all skill levels.",
    location: "Online (Jitsi)",
    daysFromNow: 12,
    duration: 120
  },
  {
    title: "European Makers Meetup — Paris",
    description: "In-person meetup for members in the Paris area. We'll visit a local makerspace and grab dinner afterward. Partners welcome!",
    location: "La Recyclerie, 83 Boulevard Ornano, 75018 Paris",
    daysFromNow: 25,
    duration: 180
  },
  {
    title: "Privacy & Security Q&A with Stefan",
    description: "Stefan Popescu, our resident cybersecurity expert, will answer all your questions about digital privacy, password managers, VPNs, and more.",
    location: "Online (Jitsi)",
    daysFromNow: 18,
    duration: 90
  }
];

// ============================================================
// DEMO PORTFOLIO ITEMS
// ============================================================
const DEMO_PORTFOLIO = [
  {
    title: "Redesigning a local food co-op's brand identity",
    description: "Complete rebrand for a cooperative of organic farmers in the Rhône Valley. From logo to packaging, everything was designed to reflect their values of sustainability and community.",
    memberName: "Sophie Laurent",
    tags: ["Design", "Branding", "Sustainability"]
  },
  {
    title: "Open-source community management tool",
    description: "A lightweight, privacy-first tool for managing volunteer teams. Built with React and Supabase. Currently used by 3 local associations in Milan.",
    memberName: "Marco Bianchi",
    tags: ["Open Source", "React", "Community"]
  },
  {
    title: "Documentary: Faces of the Market",
    description: "A photo essay capturing the vendors of Barcelona's Mercat de Sant Josep. 47 portraits, 47 stories of tradition and resilience.",
    memberName: "Clara Dubois",
    tags: ["Photography", "Documentary", "Culture"]
  },
  {
    title: "Circular Economy Report 2025",
    description: "Research report on circular economy adoption among SMEs in the Nordic region. Published in partnership with Stockholm University.",
    memberName: "Nadia Bergström",
    tags: ["Research", "Sustainability", "Circular Economy"]
  },
  {
    title: "Accessibility audit for e-commerce platforms",
    description: "Comprehensive WCAG 2.1 AA audit conducted for 5 French e-commerce sites. Identified and helped fix 200+ accessibility issues.",
    memberName: "Julie Bertrand",
    tags: ["Accessibility", "Web Development", "UX"]
  }
];

// ============================================================
// HELPERS
// ============================================================

async function supabaseRequest(path, method = 'GET', body = null, extraHeaders = {}) {
  const opts = {
    method,
    headers: { ...headers, ...extraHeaders }
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, opts);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} failed: ${res.status} ${text}`);
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('json')) {
    return res.json();
  }
  return null;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('=== Seeding Boost Club Demo Network ===\n');

  // 1. Update network description and settings
  console.log('1. Updating network details...');
  await supabaseRequest(
    `networks?id=eq.${BOOST_ID}`,
    'PATCH',
    {
      name: 'Boost Club',
      description: 'A community of European creators, entrepreneurs, and professionals who believe in building things together — without Big Tech. Share your work, join events, collaborate on projects, and connect with like-minded people across Europe.',
      privacy_level: 'private',
      features_config: {
        chat: true,
        news: true,
        wiki: true,
        files: true,
        events: true,
        courses: false,
        currency: 'EUR',
        reactions: true,
        moodboards: true,
        marketplace: false,
        monetization: false,
        activity_feed: true,
        notifications: true,
        location_sharing: false,
        allow_member_event_publishing: true
      }
    }
  );
  console.log('   Done.\n');

  // 2. Get all fake profiles (local mock paths that don't work in production)
  console.log('2. Fetching fake profiles...');
  const allProfiles = await supabaseRequest(
    `profiles?network_id=eq.${BOOST_ID}&select=id,full_name,profile_picture_url&order=created_at.asc`,
    'GET', null, { 'Prefer': 'return=representation' }
  );
  // Filter: fake profiles have local /src/mocks/ paths, placehold.co, ui-avatars.com, or pravatar.cc URLs
  const fakeProfiles = allProfiles.filter(p =>
    (p.profile_picture_url && p.profile_picture_url.startsWith('/src/mocks/')) ||
    (p.profile_picture_url && p.profile_picture_url.includes('placehold.co')) ||
    (p.profile_picture_url && p.profile_picture_url.includes('ui-avatars.com')) ||
    (p.profile_picture_url && p.profile_picture_url.includes('pravatar.cc'))
  );
  console.log(`   Found ${fakeProfiles.length} fake profiles to update (out of ${allProfiles.length} total).\n`);

  // 3. Update fake profiles with realistic data
  console.log('3. Updating fake profiles with realistic data...');
  const memberMap = {}; // name -> profile id mapping for content creation

  for (let i = 0; i < Math.min(fakeProfiles.length, DEMO_MEMBERS.length); i++) {
    const profile = fakeProfiles[i];
    const member = DEMO_MEMBERS[i];
    const avatarUrl = getAvatarUrl(member.name, i);

    await supabaseRequest(
      `profiles?id=eq.${profile.id}`,
      'PATCH',
      {
        full_name: member.name,
        bio: member.bio,
        skills: member.skills,
        profile_picture_url: avatarUrl,
        linkedin_url: member.linkedin,
        contact_email: `${member.name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 8)}@example.com`
      }
    );

    memberMap[member.name] = profile.id;
    process.stdout.write(`   Updated: ${member.name} (${i + 1}/${Math.min(fakeProfiles.length, DEMO_MEMBERS.length)})\r`);
  }

  // Mark remaining fake profiles with less detailed but still realistic data
  const extraNames = [
    "Ana Petrov", "David Schneider", "Louise Bernard", "Ines Ferreira",
    "Patrick O'Sullivan", "Zoe Papadimitriou", "Max Eriksson", "Lucia Moretti",
    "Yann Kergoat", "Petra Svoboda", "Florian Haas", "Diana Moldovan",
    "Simon Leclerc", "Astrid Nyman", "Rafael Sousa", "Karin Holm",
    "Baptiste Dumas", "Tereza Hájková", "Axel Lindberg", "Valentina Greco",
    "Pauline Charpentier", "Otto Krause", "Silvia Piras", "Damien Faure",
    "Johanna Schulz", "Manuel Alves", "Céline Morel", "Mikael Virtanen",
    "Beatrice Santi", "Adrien Roche", "Elisa Koenig", "Thiago Cardoso",
    "Nina Bauer", "Gabriel Dupont"
  ];

  for (let i = DEMO_MEMBERS.length; i < fakeProfiles.length; i++) {
    const profile = fakeProfiles[i];
    const nameIdx = i - DEMO_MEMBERS.length;
    const name = nameIdx < extraNames.length ? extraNames[nameIdx] : `Member ${i + 1}`;
    const avatarUrl = getAvatarUrl(name, i);

    const roles = ["designer", "developer", "marketer", "community builder", "consultant", "freelancer", "researcher", "educator"];
    const cities = ["Paris", "Berlin", "Amsterdam", "Barcelona", "Lisbon", "Vienna", "Dublin", "Copenhagen", "Milan", "Prague"];

    await supabaseRequest(
      `profiles?id=eq.${profile.id}`,
      'PATCH',
      {
        full_name: name,
        bio: `${roles[i % roles.length].charAt(0).toUpperCase() + roles[i % roles.length].slice(1)} based in ${cities[i % cities.length]}.`,
        profile_picture_url: avatarUrl,
        contact_email: `${name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 8)}@example.com`
      }
    );
    process.stdout.write(`   Updated: ${name} (${i + 1}/${fakeProfiles.length})\r`);
  }
  console.log('\n   All profiles updated.\n');

  // 4. Get admin profile for authoring content
  console.log('4. Finding admin profile for content authoring...');
  const admins = await supabaseRequest(
    `profiles?network_id=eq.${BOOST_ID}&role=eq.admin&select=id,full_name`,
    'GET', null, { 'Prefer': 'return=representation' }
  );
  const adminId = admins[0]?.id;
  console.log(`   Admin: ${admins[0]?.full_name} (${adminId})\n`);

  // Use Sophie Laurent's profile for some posts
  const sophieId = memberMap['Sophie Laurent'] || adminId;
  const marcoId = memberMap['Marco Bianchi'] || adminId;

  // 5. Create news posts
  console.log('5. Creating news posts...');

  // Check existing news
  const existingNews = await supabaseRequest(
    `network_news?network_id=eq.${BOOST_ID}&select=id`,
    'GET', null, { 'Prefer': 'return=representation' }
  );

  if (existingNews.length === 0) {
    for (const news of DEMO_NEWS) {
      const authorId = news.title.includes('Welcome') ? adminId :
                       news.title.includes('collaborators') ? marcoId : sophieId;
      await supabaseRequest(
        'network_news',
        'POST',
        {
          network_id: BOOST_ID,
          title: news.title,
          content: news.content,
          created_by: authorId,
          created_at: daysAgo(news.daysAgo)
        }
      );
      console.log(`   Created: "${news.title}"`);
    }
  } else {
    console.log(`   Skipping — ${existingNews.length} news posts already exist.`);
  }
  console.log('');

  // 6. Create events
  console.log('6. Creating events...');

  const existingEvents = await supabaseRequest(
    `network_events?network_id=eq.${BOOST_ID}&select=id`,
    'GET', null, { 'Prefer': 'return=representation' }
  );

  if (existingEvents.length === 0) {
    for (const event of DEMO_EVENTS) {
      const startDate = daysFromNow(event.daysFromNow);
      const endDate = new Date(new Date(startDate).getTime() + event.duration * 60000).toISOString();

      await supabaseRequest(
        'network_events',
        'POST',
        {
          network_id: BOOST_ID,
          title: event.title,
          description: event.description,
          location: event.location,
          date: startDate,
          end_date: endDate,
          created_by: adminId,
          status: 'approved'
        }
      );
      console.log(`   Created: "${event.title}"`);
    }
  } else {
    console.log(`   Skipping — ${existingEvents.length} events already exist.`);
  }
  console.log('');

  // 7. Create portfolio items
  console.log('7. Creating portfolio items...');

  // portfolio_items doesn't have network_id, so check by profile_ids
  const boostProfileIds = Object.values(memberMap);
  let hasPortfolio = false;
  if (boostProfileIds.length > 0) {
    const existingPortfolio = await supabaseRequest(
      `portfolio_items?profile_id=eq.${boostProfileIds[0]}&select=id`,
      'GET', null, { 'Prefer': 'return=representation' }
    );
    hasPortfolio = existingPortfolio.length > 0;
  }

  if (!hasPortfolio) {
    for (const item of DEMO_PORTFOLIO) {
      const profileId = memberMap[item.memberName] || adminId;
      await supabaseRequest(
        'portfolio_items',
        'POST',
        {
          profile_id: profileId,
          title: item.title,
          description: item.description
        }
      );
      console.log(`   Created: "${item.title}" by ${item.memberName}`);
    }
  } else {
    console.log(`   Skipping — portfolio items already exist.`);
  }
  console.log('');

  console.log('=== Done! Boost Club is now populated with demo data. ===');
  console.log(`\nMembers updated: ${fakeProfiles.length}`);
  console.log(`News posts: ${DEMO_NEWS.length}`);
  console.log(`Events: ${DEMO_EVENTS.length}`);
  console.log(`Portfolio items: ${DEMO_PORTFOLIO.length}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
