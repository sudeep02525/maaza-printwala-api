import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Template from './src/models/Template.js';
import Product from './src/models/Product.js';

const templatesData = [
  {
    name: 'Elegant Serif',
    colors: [
      { name: 'Maroon', code: '#451a2e', accent: '#eab308', text: '#ffffff' },
      { name: 'Navy', code: '#1e3a8a', accent: '#fbbf24', text: '#ffffff' },
      { name: 'Dark Green', code: '#064e3b', accent: '#d97706', text: '#ffffff' },
      { name: 'Black', code: '#111827', accent: '#f3f4f6', text: '#9ca3af' }
    ],
    generateSvg: (bg, accent, text) => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 350" width="100%" height="100%">
        <rect width="100%" height="100%" fill="${bg}" />
        <text x="300" y="140" font-family="Georgia, serif" font-size="48" font-style="italic" fill="${accent}" text-anchor="middle">C &amp; C</text>
        <rect x="260" y="175" width="80" height="2" fill="${accent}" opacity="0.5" />
        <text x="300" y="225" font-family="Arial, sans-serif" font-size="18" fill="${text}" text-anchor="middle" letter-spacing="4" opacity="0.9">BOUTIQUE</text>
        <text x="300" y="305" font-family="Arial, sans-serif" font-size="14" fill="${accent}" text-anchor="middle" opacity="0.8">www.boutique.com</text>
      </svg>
    `,
    generateCanvasJson: (bg, accent, text) => ({
      version: "7.4.0",
      width: 600,
      height: 350,
      objects: [
        { type: "Rect", left: 0, top: 0, width: 600, height: 350, fill: bg, selectable: false, originX: "left", originY: "top" },
        { type: "Textbox", left: 100, top: 90, width: 400, fontSize: 48, fontFamily: "Georgia", fontStyle: "italic", fill: accent, text: "C & C", textAlign: "center", originX: "left", originY: "top", id: "company_name" },
        { type: "Rect", left: 260, top: 175, width: 80, height: 2, fill: accent, opacity: 0.5, originX: "left", originY: "top" },
        { type: "Textbox", left: 100, top: 205, width: 400, fontSize: 18, fontFamily: "Arial", fill: text, text: "BOUTIQUE", textAlign: "center", originX: "left", originY: "top", id: "tagline" },
        { type: "Textbox", left: 100, top: 285, width: 400, fontSize: 14, fontFamily: "Arial", fill: accent, text: "www.boutique.com", textAlign: "center", originX: "left", originY: "top", id: "website" }
      ]
    }),
    fields: [
      { key: 'company_name', label: 'Company Name', type: 'TEXT', defaultValue: 'C & C' },
      { key: 'tagline', label: 'Tagline', type: 'TEXT', defaultValue: 'BOUTIQUE' },
      { key: 'website', label: 'Website', type: 'TEXT', defaultValue: 'www.boutique.com' }
    ]
  },
  {
    name: 'Bold Vanguard',
    colors: [
      { name: 'Red', code: '#dc2626', accent: '#ffffff', text: '#0f172a' },
      { name: 'Blue', code: '#2563eb', accent: '#ffffff', text: '#0f172a' },
      { name: 'Orange', code: '#ea580c', accent: '#ffffff', text: '#0f172a' },
      { name: 'Purple', code: '#7c3aed', accent: '#ffffff', text: '#0f172a' }
    ],
    generateSvg: (bg, accent, text) => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 350" width="100%" height="100%">
        <rect width="100%" height="100%" fill="#ffffff" />
        <rect x="0" y="0" width="600" height="160" fill="${bg}" />
        <circle cx="65" cy="65" r="25" fill="#ffffff" />
        <text x="65" y="75" font-family="Arial, sans-serif" font-size="30" font-weight="bold" fill="${bg}" text-anchor="middle">V</text>
        <text x="40" y="235" font-family="Arial, sans-serif" font-size="32" font-weight="900" fill="${text}">VANGUARD</text>
        <text x="40" y="270" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="${bg}">CREATIVE AGENCY</text>
        <text x="40" y="315" font-family="Arial, sans-serif" font-size="14" fill="#64748b">New York, NY</text>
        <text x="560" y="315" font-family="Arial, sans-serif" font-size="14" fill="#64748b" text-anchor="end">vanguard.io</text>
      </svg>
    `,
    generateCanvasJson: (bg, accent, text) => ({
      version: "7.4.0",
      width: 600,
      height: 350,
      objects: [
        { type: "Rect", left: 0, top: 0, width: 600, height: 350, fill: "#ffffff", selectable: false, originX: "left", originY: "top" },
        { type: "Rect", left: 0, top: 0, width: 600, height: 160, fill: bg, originX: "left", originY: "top" },
        { type: "Circle", left: 40, top: 40, radius: 25, fill: "#ffffff", originX: "left", originY: "top" },
        { type: "Textbox", left: 40, top: 47, width: 50, fontSize: 30, fontWeight: "bold", fontFamily: "Arial", fill: bg, text: "V", textAlign: "center", originX: "left", originY: "top", id: "logo_letter" },
        { type: "Textbox", left: 40, top: 200, width: 350, fontSize: 32, fontWeight: "900", fontFamily: "Arial", fill: text, text: "VANGUARD", originX: "left", originY: "top", id: "company_name" },
        { type: "Textbox", left: 40, top: 250, width: 350, fontSize: 16, fontWeight: "bold", fontFamily: "Arial", fill: bg, text: "CREATIVE AGENCY", originX: "left", originY: "top", id: "tagline" },
        { type: "Textbox", left: 40, top: 300, width: 220, fontSize: 14, fontFamily: "Arial", fill: "#64748b", text: "New York, NY", originX: "left", originY: "top", id: "address" },
        { type: "Textbox", left: 340, top: 300, width: 220, fontSize: 14, fontFamily: "Arial", fill: "#64748b", text: "vanguard.io", textAlign: "right", originX: "left", originY: "top", id: "website" }
      ]
    }),
    fields: [
      { key: 'logo_letter', label: 'Logo Letter', type: 'TEXT', defaultValue: 'V' },
      { key: 'company_name', label: 'Company Name', type: 'TEXT', defaultValue: 'VANGUARD' },
      { key: 'tagline', label: 'Tagline', type: 'TEXT', defaultValue: 'CREATIVE AGENCY' },
      { key: 'address', label: 'Address', type: 'TEXT', defaultValue: 'New York, NY' },
      { key: 'website', label: 'Website', type: 'TEXT', defaultValue: 'vanguard.io' }
    ]
  },
  {
    name: 'Modern Dark Nexus',
    colors: [
      { name: 'Dark Slate', code: '#0f172a', accent: '#3b82f6', text: '#ffffff' },
      { name: 'Charcoal', code: '#1c1917', accent: '#f43f5e', text: '#ffffff' },
      { name: 'Deep Forest', code: '#064e3b', accent: '#10b981', text: '#ffffff' },
      { name: 'Midnight', code: '#171717', accent: '#eab308', text: '#ffffff' }
    ],
    generateSvg: (bg, accent, text) => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 350" width="100%" height="100%">
        <rect width="100%" height="100%" fill="${bg}" />
        <text x="40" y="80" font-family="Arial, sans-serif" font-size="32" font-weight="bold" letter-spacing="4" fill="${text}">NEXUS</text>
        <rect x="502" y="32" width="36" height="36" fill="${accent}" transform="rotate(45 520 50)" />
        <text x="560" y="235" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="${text}" text-anchor="end">ALEX CHEN</text>
        <text x="560" y="270" font-family="Arial, sans-serif" font-size="16" fill="#94a3b8" text-anchor="end">SOFTWARE ENGINEER</text>
        <text x="560" y="310" font-family="Arial, sans-serif" font-size="14" fill="#64748b" text-anchor="end">+1 555 0199 • alex@nexus.dev</text>
      </svg>
    `,
    generateCanvasJson: (bg, accent, text) => ({
      version: "7.4.0",
      width: 600,
      height: 350,
      objects: [
        { type: "Rect", left: 0, top: 0, width: 600, height: 350, fill: bg, selectable: false, originX: "left", originY: "top" },
        { type: "Textbox", left: 40, top: 50, width: 250, fontSize: 32, fontWeight: "bold", fontFamily: "Arial", fill: text, text: "NEXUS", originX: "left", originY: "top", id: "company_name" },
        { type: "Rect", left: 520, top: 50, width: 36, height: 36, fill: accent, angle: 45, originX: "center", originY: "center" },
        { type: "Textbox", left: 240, top: 210, width: 320, fontSize: 24, fontWeight: "bold", fontFamily: "Arial", fill: text, text: "ALEX CHEN", textAlign: "right", originX: "left", originY: "top", id: "person_name" },
        { type: "Textbox", left: 240, top: 250, width: 320, fontSize: 16, fontFamily: "Arial", fill: "#94a3b8", text: "SOFTWARE ENGINEER", textAlign: "right", originX: "left", originY: "top", id: "job_title" },
        { type: "Textbox", left: 240, top: 295, width: 320, fontSize: 14, fontFamily: "Arial", fill: "#64748b", text: "+1 555 0199 • alex@nexus.dev", textAlign: "right", originX: "left", originY: "top", id: "contact_info" }
      ]
    }),
    fields: [
      { key: 'company_name', label: 'Company Name', type: 'TEXT', defaultValue: 'NEXUS' },
      { key: 'person_name', label: 'Person Name', type: 'TEXT', defaultValue: 'ALEX CHEN' },
      { key: 'job_title', label: 'Job Title', type: 'TEXT', defaultValue: 'SOFTWARE ENGINEER' },
      { key: 'contact_info', label: 'Contact Info', type: 'TEXT', defaultValue: '+1 555 0199 • alex@nexus.dev' }
    ]
  }
];

function svgToBase64(svgString) {
  return 'data:image/svg+xml;base64,' + Buffer.from(svgString.trim()).toString('base64');
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  // Delete ALL existing templates
  await Template.deleteMany({});
  console.log('Deleted all old templates globally');

  // Find all products
  const products = await Product.find({});
  
  // Create new templates for every product
  for (const product of products) {
    for (const tData of templatesData) {
      const colorVariants = tData.colors.map(color => {
        const svg = tData.generateSvg(color.code, color.accent, color.text);
        const canvasJson = tData.generateCanvasJson(color.code, color.accent, color.text);
        return {
          name: color.name,
          colorCode: color.code,
          previewFront: svgToBase64(svg),
          canvasJson: canvasJson
        };
      });

      const t = new Template({
        product: product._id,
        name: tData.name,
        thumbnail: colorVariants[0].previewFront,
        previewFront: colorVariants[0].previewFront,
        canvasJson: colorVariants[0].canvasJson,
        colorVariants: colorVariants,
        editableFields: tData.fields,
        isActive: true,
        isDemoData: false
      });
      
      await t.save();
    }
  }

  console.log('Done! Created 3 real templates for each of the ' + products.length + ' products.');
  process.exit(0);
}

run().catch(console.error);
