export type Category = {
  id: string;
  name: string;
  slug: string;
  color: string;
};

export type Source = {
  id: string;
  name: string;
  url: string;
};

export type Article = {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  publishedAt: string;
  readTime: number;
  categoryId: string;
  sourceId: string;
};

export type UserRole = "admin" | "user";

export type User = {
  id: string;
  email: string;
  password: string; // bcrypt hash
  name: string;
  role: UserRole;
  createdAt: string;
};

export type SafeUser = Omit<User, "password">;

export type ArticleWithRelations = Article & {
  category: Category;
  source: Source;
};

// --- Categories ---
export const categories: Category[] = [
  { id: "cat-1", name: "Politika", slug: "politika", color: "#cf222e" },
  { id: "cat-2", name: "Sport", slug: "sport", color: "#1a7f37" },
  { id: "cat-3", name: "Teknologji", slug: "teknologji", color: "#0969da" },
  { id: "cat-4", name: "Kultura", slug: "kultura", color: "#8250df" },
  { id: "cat-5", name: "Ekonomi", slug: "ekonomi", color: "#e16f24" },
  { id: "cat-6", name: "World", slug: "world", color: "#0550ae" },
];

// --- Sources ---
export const sources: Source[] = [
  { id: "src-1", name: "Gazeta Express", url: "https://www.gazetaexpress.com" },
  { id: "src-2", name: "Koha Ditore", url: "https://www.koha.net" },
  { id: "src-3", name: "Telegrafi", url: "https://telegrafi.com" },
  { id: "src-4", name: "Klan Kosova", url: "https://klankosova.tv" },
];

// --- Articles (mutable array for CRUD) ---
export const articles: Article[] = [
  {
    id: "art-1",
    title: "Qeveria miraton pakon e re ekonomike për vitin 2026",
    summary: "Pakoja e re përfshin masa për përkrahjen e bizneseve të vogla dhe uljen e tatimeve për sektorin e teknologjisë.",
    content: "Qeveria ka miratuar sot pakon e re ekonomike që synon të stimulojë rritjen ekonomike përmes masave të ndryshme. Pakoja përfshin uljen e tatimeve për bizneset e vogla, subvencionimin e sektorit të teknologjisë dhe investime të reja në infrastrukturë. Kryeministri tha se kjo pako do të krijojë mbi 10,000 vende të reja pune gjatë dy viteve të ardhshme.",
    imageUrl: "https://picsum.photos/seed/politika1/800/400",
    publishedAt: "2026-03-31T08:00:00Z",
    readTime: 4,
    categoryId: "cat-1",
    sourceId: "src-1",
  },
  {
    id: "art-2",
    title: "Kosova U21 fiton ndeshjen kundër Shqipërisë U21",
    summary: "Një ndeshje e jashtëzakonshme ku ekipi kosovar tregoi lojë të shkëlqyer me rezultat 2-1.",
    content: "Në stadiumin Fadil Vokrri në Prishtinë, përfaqësuesja U21 e Kosovës ka arritur fitore bindëse kundër Shqipërisë me rezultat 2-1. Golat për Kosovën i shënuan lojtarët e rinj që luajnë në ligat evropiane. Trajneri u shpreh i kënaqur me paraqitjen e ekipit.",
    imageUrl: "https://picsum.photos/seed/sport1/800/400",
    publishedAt: "2026-03-31T10:30:00Z",
    readTime: 3,
    categoryId: "cat-2",
    sourceId: "src-3",
  },
  {
    id: "art-3",
    title: "Startup-i kosovar mbledh 5 milion euro investim",
    summary: "Kompania e teknologjisë nga Prishtina ka tërhequr investitorë nga Berlini dhe Vjena.",
    content: "Një startup i teknologjisë me bazë në Prishtinë ka arritur të mbledhë 5 milion euro në raundin e parë të financimit. Kompania zhvillon zgjidhje të inteligjencës artificiale për sektorin e shëndetësisë. Investitorët kryesorë vijnë nga Berlini dhe Vjena.",
    imageUrl: "https://picsum.photos/seed/tech1/800/400",
    publishedAt: "2026-03-31T09:15:00Z",
    readTime: 5,
    categoryId: "cat-3",
    sourceId: "src-2",
  },
  {
    id: "art-4",
    title: "Festivali Ndërkombëtar i Filmit hapet në Prizren",
    summary: "Edicioni i ri sjell mbi 50 filma nga e gjithë bota me fokus në kinematografinë ballkanike.",
    content: "Festivali Ndërkombëtar i Filmit të Dokumentarit në Prizren ka hapur dyert për edicionin e ri. Këtë vit festivali sjell mbi 50 filma nga 30 vende të ndryshme, me fokus të veçantë në kinematografinë ballkanike.",
    imageUrl: "https://picsum.photos/seed/kultura1/800/400",
    publishedAt: "2026-03-30T14:00:00Z",
    readTime: 3,
    categoryId: "cat-4",
    sourceId: "src-4",
  },
  {
    id: "art-5",
    title: "Eksporti i Kosovës rritet për 15% në tremujorin e parë",
    summary: "Sektorët e teknologjisë dhe bujqësisë udhëheqin rritjen e eksporteve në tregjet evropiane.",
    content: "Të dhënat e reja tregojnë se eksporti i Kosovës ka shënuar rritje prej 15% në tremujorin e parë të vitit 2026 krahasuar me vitin paraprak. Sektorët kryesorë që kontribuan në këtë rritje janë teknologjia e informacionit dhe bujqësia.",
    imageUrl: "https://picsum.photos/seed/ekonomi1/800/400",
    publishedAt: "2026-03-31T07:00:00Z",
    readTime: 4,
    categoryId: "cat-5",
    sourceId: "src-1",
  },
  {
    id: "art-7",
    title: "Prishtina Smart City: Projekti i ri i digjitalizimit",
    summary: "Komuna e Prishtinës lanson platformën e re dixhitale për shërbime komunale.",
    content: "Komuna e Prishtinës ka lansuar sot projektin 'Prishtina Smart City' që synon digjitalizimin e plotë të shërbimeve komunale. Platforma e re do t'u mundësojë qytetarëve të kryejnë të gjitha procedurat administrative online.",
    imageUrl: "https://picsum.photos/seed/tech2/800/400",
    publishedAt: "2026-03-30T11:00:00Z",
    readTime: 4,
    categoryId: "cat-3",
    sourceId: "src-3",
  },
  {
    id: "art-8",
    title: "Superliga: Prishtina FC kryeson tabelën",
    summary: "Pas fitores bindëse 3-0, Prishtina FC merr kreun e tabelës me 5 pikë dallim.",
    content: "Prishtina FC ka arritur fitore të madhe 3-0 në ndeshjen e fundit të Superligës, duke marrë kreun e tabelës me 5 pikë dallim nga ndjekësi më i afërt. Golashënuesi kryesor i ekipit shënoi dy gola.",
    imageUrl: "https://picsum.photos/seed/sport2/800/400",
    publishedAt: "2026-03-29T20:00:00Z",
    readTime: 3,
    categoryId: "cat-2",
    sourceId: "src-4",
  },
  {
    id: "art-9",
    title: "Artisti kosovar fiton çmimin në Bienalen e Venedikut",
    summary: "Instalacioni artistik 'Kufiri i Memories' tërhoqi vëmendjen e kritikëve ndërkombëtarë.",
    content: "Artisti kosovar ka fituar çmimin special në Bienalen e Artit të Venedikut me instalacionin 'Kufiri i Memories'. Vepra eksploron temat e identitetit dhe migracionit përmes mediave të përziera.",
    imageUrl: "https://picsum.photos/seed/kultura2/800/400",
    publishedAt: "2026-03-29T13:00:00Z",
    readTime: 4,
    categoryId: "cat-4",
    sourceId: "src-1",
  },
  {
    id: "art-10",
    title: "Zgjedhjet lokale: Partitë fillojnë fushatën elektorale",
    summary: "Fushata zyrtare fillon sot me mitingje në Prishtinë, Prizren dhe Pejë.",
    content: "Fushata elektorale për zgjedhjet lokale ka filluar zyrtarisht sot. Partitë kryesore kanë organizuar mitingje në qytetet e mëdha duke prezantuar kandidatët dhe programet e tyre.",
    imageUrl: "https://picsum.photos/seed/politika2/800/400",
    publishedAt: "2026-03-29T09:00:00Z",
    readTime: 5,
    categoryId: "cat-1",
    sourceId: "src-2",
  },
  {
    id: "art-11",
    title: "BQK: Inflacioni bie në 2.1% në muajin mars",
    summary: "Banka Qendrore raporton stabilizim të çmimeve pas masave të marra në fillim të vitit.",
    content: "Banka Qendrore e Kosovës ka raportuar se inflacioni ka rënë në 2.1% në muajin mars, nga 3.5% sa ishte në janar. Kjo rënie atribuohet masave stabilizuese të marra nga qeveria.",
    imageUrl: "https://picsum.photos/seed/ekonomi2/800/400",
    publishedAt: "2026-03-30T08:30:00Z",
    readTime: 4,
    categoryId: "cat-5",
    sourceId: "src-3",
  },
  {
    id: "art-12",
    title: "5G lansohet zyrtarisht në Kosovë",
    summary: "Operatorët e telekomit fillojnë ofrimin e shërbimeve 5G në Prishtinë dhe Prizren.",
    content: "Kosova ka bërë hapin e madh drejt konektivitetit të avancuar me lansimin zyrtar të rrjetit 5G. Fillimisht shërbimi do të jetë i disponueshëm në Prishtinë dhe Prizren.",
    imageUrl: "https://picsum.photos/seed/tech3/800/400",
    publishedAt: "2026-03-31T06:00:00Z",
    readTime: 3,
    categoryId: "cat-3",
    sourceId: "src-4",
  },
  {
    id: "art-14",
    title: "Basketbollisti kosovar transferohet në NBA",
    summary: "Lojtari 22-vjeçar nënshkruan kontratë dy-vjeçare me ekipin amerikan.",
    content: "Basketbollisti kosovar ka realizuar ëndrrën e tij duke nënshkruar kontratë me një ekip të NBA-së. Lojtari 22-vjeçar shkëlqeu në ligën gjermane sezonin e kaluar.",
    imageUrl: "https://picsum.photos/seed/sport3/800/400",
    publishedAt: "2026-03-28T19:00:00Z",
    readTime: 3,
    categoryId: "cat-2",
    sourceId: "src-3",
  },
  {
    id: "art-15",
    title: "Reforma arsimore: Kurrikula e re për shkollat fillore",
    summary: "Ministria e Arsimit prezanton ndryshime të mëdha në planprogramin mësimor.",
    content: "Ministria e Arsimit ka prezantuar sot kurrikulën e re për shkollat fillore që do të hyjë në fuqi nga shtatori 2026. Ndryshimet kryesore përfshijnë futjen e kodimit nga klasa e tretë.",
    imageUrl: "https://picsum.photos/seed/politika3/800/400",
    publishedAt: "2026-03-28T10:00:00Z",
    readTime: 5,
    categoryId: "cat-1",
    sourceId: "src-4",
  },
  {
    id: "art-16",
    title: "Turizmi në Kosovë: Numri i vizitorëve dyfishohet",
    summary: "Rugova, Sharri dhe Prizreni tërheqin turistë nga e gjithë Evropa.",
    content: "Statistikat e reja tregojnë se numri i turistëve që vizituan Kosovën në tremujorin e parë të 2026 është dyfishuar krahasuar me periudhën e njëjtë të vitit të kaluar.",
    imageUrl: "https://picsum.photos/seed/ekonomi3/800/400",
    publishedAt: "2026-03-28T12:00:00Z",
    readTime: 4,
    categoryId: "cat-5",
    sourceId: "src-2",
  },
];

// --- Helper to join article with its category and source ---
export function getArticleWithRelations(article: Article): ArticleWithRelations {
  const category = categories.find((c) => c.id === article.categoryId)!;
  const source = sources.find((s) => s.id === article.sourceId)!;
  return { ...article, category, source };
}

// --- Users (mutable array for auth) ---
export const users: User[] = [
  {
    id: "usr-1",
    email: "admin@gjirafanews.com",
    password: "$2b$10$A.iCtdsJ4MCr/pv5Xfq4f.KiyaxNR/w1hYZAHPFAWjaq/ytnLR6MS",
    name: "Admin",
    role: "admin",
    createdAt: "2026-01-01T00:00:00Z",
  },
];

// --- Generate unique IDs ---
let counter = articles.length + 1;
export function generateId(): string {
  return `art-${++counter}`;
}

let userCounter = users.length + 1;
export function generateUserId(): string {
  return `usr-${++userCounter}`;
}
