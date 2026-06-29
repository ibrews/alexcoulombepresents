import { site } from "./data";

const base = site.url.replace(/\/$/, "");

export const socials = [
  "https://github.com/ibrews",
  "https://www.linkedin.com/in/alexcoulombe",
  "https://twitter.com/ibrews",
  "https://youtube.com/@ibrews",
  "https://uepodcast.com",
];

// Person + Organization + WebSite — rendered sitewide in the root layout as one
// @graph so Google can build a knowledge panel for Alex and the training center.
export const siteGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${base}/#alex`,
      name: "Alex Coulombe",
      url: base,
      image: `${base}/social.png`,
      jobTitle: "Co-founder & CEO, Agile Lens · Unreal Authorized Instructor",
      description:
        "Architect turned XR-chitect: Unreal Engine, Godot, and Apple Vision Pro developer, AI-agent builder, and immersive-theatre director.",
      worksFor: { "@type": "Organization", name: "Agile Lens", url: "https://agilelens.com" },
      alumniOf: { "@type": "CollegeOrUniversity", name: "Syracuse University" },
      knowsAbout: [
        "Unreal Engine",
        "Apple Vision Pro",
        "Godot Engine",
        "Virtual Reality",
        "Mixed Reality",
        "Spatial Computing",
        "Immersive Theatre",
        "AI Coding Agents",
        "MetaHumans",
        "Pixel Streaming",
      ],
      sameAs: socials,
    },
    {
      "@type": "EducationalOrganization",
      "@id": `${base}/#org`,
      name: "Alex Coulombe Presents",
      url: base,
      description:
        "Manhattan's first Unreal Authorized Training Center — live Unreal Engine training in AI for Unreal, Blueprints, VR/AR, MetaHumans, ArchViz, and virtual production.",
      founder: { "@id": `${base}/#alex` },
      sameAs: socials,
    },
    {
      "@type": "WebSite",
      "@id": `${base}/#website`,
      url: base,
      name: site.title,
      description: site.description,
      publisher: { "@id": `${base}/#alex` },
    },
  ],
};

// Course schema for /training.
export const trainingCourse = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: "Unreal Engine Training with Alex Coulombe",
  description:
    "Live Unreal Engine training from a top-rated Epic Games Authorized Instructor at Manhattan's first Unreal Authorized Training Center — AI for Unreal, Blueprints & C++, VR/AR including Apple Vision Pro, MetaHumans, ArchViz, Pixel Streaming, and virtual production.",
  url: `${base}/training`,
  provider: {
    "@type": "EducationalOrganization",
    name: "Alex Coulombe Presents",
    url: base,
  },
  instructor: { "@type": "Person", name: "Alex Coulombe", url: base },
  hasCourseInstance: {
    "@type": "CourseInstance",
    courseMode: "online",
    courseWorkload: "PT2H",
  },
};
