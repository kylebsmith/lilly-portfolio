/* ───────────────────────────────────────────────────────────
 *  ✦ This is your site's name, email, links, and bio. ✦
 *
 *  Edit the values inside the quotes. Don't delete the
 *  commas or the curly braces.
 *  ───────────────────────────────────────────────────────── */

export const site = {
  name: "Lilly Patterson",
  tagline: "Illustration · Visual Development",
  description:
    "Portfolio of Lilly Patterson — illustrator and visual development artist.",
  email: "lillybpatterson@gmail.com",
  url: "https://lillybpatterson.com",

  // Replace these with your real handles. To remove one,
  // delete the whole {…}, line including the comma.
  social: [
    { label: "Instagram", href: "https://www.instagram.com/lilly_padd_art" },
  ],

  // The top navigation. Order = order shown.
  nav: [
    { label: "Work", href: "/work" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],

  about: {
    // Each item in the array is one paragraph on the /about page.
    bio: [
      "I am an illustrator with a love for storytelling through character and design.",
      "I grew up in Steamboat Springs, Colorado, and earned my Bachelor of Arts from the University of Colorado Boulder. I am now pursuing my Master of Fine Arts in Illustration at The Savannah College of Art and Design, Atlanta, where I continue to develop my skills in concept art, character design, and visual development.",
      "My artistic style reflects a whimsical perspective on everyday life, inspired by subtle, quiet moments and the connections I find in the world around me. I am constantly drawn to the simplest things — strange insects, shifting light, fleeting details, anything to make me stop and look closer.",
      "My illustrations have been featured by Minds in Motion for mental health awareness campaigns and recognized by the University of Colorado Boulder Student Arts Program. I have also performed live illustration as a part of “Omnimodal,” a multi-media performance hosted by the Serenbe Art Farm.",
    ],
    location: "Atlanta, GA",
    program: "MFA Illustration, SCAD Atlanta",
  },

  // The slugs that appear in the "a few favorites" strip on the home page,
  // in the order they appear. The hero piece (project folder `01_*`) is
  // shown above this and is not duplicated. Missing slugs are skipped.
  homeFavorites: ["breath-of-life", "lost-in-a-dream", "girl-with-a-dragon-tattoo"],
} as const;

export type Site = typeof site;
