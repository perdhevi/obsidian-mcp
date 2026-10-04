import { embedDocs, embedQuery } from "../src/embed.js";

const cos = (a, b) => {
    let d = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2; }
    return d / Math.sqrt(na * nb);
};

const docs = [
    "How to reset a customer's ERP password",
    "Steps for unlocking a locked user account",
    "works with Windows",
    "doesn't work with Windows",
    "how to works with Windows",
    "Recipe for nasi goreng with fried egg",
    "Recipe for nasi lemak with fried egg",
    "Notes on LanceDB vector indexes",
];
const dv = await embedDocs(docs);
console.log("dimensions:", dv[0].length);

const qv = await embedQuery("user can't log in");
docs.map((d, i) => [cos(qv, dv[i]).toFixed(3), d])
    .sort((a, b) => b[0] - a[0])
    .forEach(([s, d]) => console.log(s, d));