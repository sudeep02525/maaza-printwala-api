import Fuse from 'fuse.js';

const dictionary = [
  "Visiting Cards",
  "Flyers",
  "Business Cards",
  "Premium Visiting Cards"
];

const fuse = new Fuse(dictionary.map(term => ({ term })), {
  keys: ['term'],
  includeScore: true,
  threshold: 0.4
});

console.log("visihng crd ->", fuse.search("visihng crd"));
console.log("vistng ->", fuse.search("vistng"));
