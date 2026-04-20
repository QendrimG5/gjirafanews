import { NextRequest } from "next/server";

// Per-category response pools — keyed by category ID
const CATEGORY_RESPONSES: Record<string, Record<string, string>> = {
  "cat-1": {
    default:
      "Situata politike në Kosovë vazhdon të jetë dinamike. Dialogu Kosovë-Serbi mbetet tema kryesore, ndërsa qeveria po punon në reformat për integrimin evropian. Zgjedhjet lokale po afrohen dhe partitë kanë filluar fushatën elektorale me premtime për zhvillim dhe qeverisje të mirë.",
    zgjedhje:
      "Zgjedhjet lokale janë planifikuar për këtë vit dhe fushata elektorale ka filluar tashmë. Partitë kryesore kanë prezantuar kandidatët e tyre në qytetet e mëdha. Debatet po përqendrohen në çështje si punësimi, infrastruktura dhe transparenca e qeverisjes vendore.",
    dialog:
      "Dialogu Kosovë-Serbi vazhdon të jetë një nga temat më të rëndësishme politike. Bashkimi Evropian po ndërmjetëson bisedimet, duke kërkuar normalizim të plotë të marrëdhënieve. Zbatimi i marrëveshjeve të arritura mbetet sfida kryesore për të dyja palët.",
  },
  "cat-2": {
    default:
      "Sporti kosovar po shkëlqen në arenën ndërkombëtare. Superliga e futbollit po ofron ndeshje cilësore, ndërsa sportistët individualë po fitojnë medalje në kampionate botërore. Xhudo, boksi dhe atletika mbeten sportet ku Kosova ka arritur sukseset më të mëdha.",
    futboll:
      "Superliga e Kosovës po kalon një sezon emocionues. Prishtina FC kryeson tabelën me lojë bindëse, ndërsa garës për titull i janë bashkuar edhe disa ekipe të tjera. Përfaqësuesja kombëtare po përgatitet për ndeshjet e radhës në eliminatoret evropiane.",
    olimpiade:
      "Sportistët kosovarë po përgatiten intensivisht për Lojërat Olimpike. Në xhudo dhe boks, Kosova ka shanse reale për medalje. Federatat sportive po investojnë në përgatitjen e atletëve dhe infrastrukturën sportive për të siguruar rezultate sa më të mira.",
  },
  "cat-3": {
    default:
      "Sektori i teknologjisë në Kosovë po rritet me shpejtësi të madhe. Startup-et vendore po tërheqin investime nga fondet evropiane, ndërsa lansimi i rrjetit 5G po hap mundësi të reja. Digjitalizimi i shërbimeve publike dhe edukimi në fushën e IT-së janë prioritetet kryesore.",
    ai:
      "Inteligjenca artificiale po bëhet gjithnjë e më prezente në Kosovë. Kompani vendore po zhvillojnë zgjidhje AI për shëndetësi, arsim dhe financa. Universitetet kanë filluar të ofrojnë programe të specializuara, duke krijuar një gjeneratë të re të ekspertëve të AI.",
    startup:
      "Ekosistemi i startup-eve në Kosovë po lulëzon. Innovation Centre Kosovo dhe inkubatorë të tjerë po ndihmojnë sipërmarrësit e rinj. Investimet e huaja kanë rritur ndjeshëm, me disa kompani që kanë mbledhur miliona euro në raunde financimi nga investitorë evropianë.",
  },
  "cat-4": {
    default:
      "Skena kulturore në Kosovë është e gjallë dhe e larmishme. Festivalet ndërkombëtare të filmit, muzikës dhe artit po tërheqin vëmendje globale. Artistët kosovarë po fitojnë çmime prestigjioze dhe po përfaqësojnë vendin në ngjarjet më të rëndësishme kulturore botërore.",
    film:
      "Kinematografia kosovare po përjeton një periudhë të artë. Filmat kosovarë po shfaqen në festivale ndërkombëtare si Berlinale, Cannes dhe Venecia. Festivali i Filmit të Dokumentarit në Prizren vazhdon të jetë një nga ngjarjet më të rëndësishme kulturore në Ballkan.",
    muzike:
      "Muzika kosovare po depërton në tregjet ndërkombëtare. Artistë të rinj po kombinojnë elementet tradicionale me zhanre moderne, duke krijuar një tingull unik. Festivalet e muzikës në Prishtinë dhe Prizren po tërheqin artistë dhe vizitorë nga mbarë bota.",
  },
  "cat-5": {
    default:
      "Ekonomia e Kosovës po tregon shenja pozitive rritjeje. Eksportet kanë rritur ndjeshëm, inflacioni po stabilizohet dhe investimet e huaja po rriten. Sektorët e teknologjisë, bujqësisë dhe turizmit janë motorët kryesorë të zhvillimit ekonomik.",
    eksport:
      "Eksportet e Kosovës kanë shënuar rritje rekorde këtë vit. Produktet e teknologjisë së informacionit dhe bujqësia janë sektorët udhëheqës. Marrëveshjet e reja tregtare me vendet e BE-së po hapin tregje të reja për bizneset kosovare.",
    investime:
      "Klima e investimeve në Kosovë po përmirësohet vazhdimisht. Qeveria ka thjeshtuar procedurat burokratike dhe ka ulur tatimet për sektorë strategjikë. Investitorë nga Gjermania, Austria dhe Zvicra janë ndër më aktivët në tregun kosovar.",
  },
  "cat-6": {
    default:
      "Në arenën ndërkombëtare, zhvillimet gjeopolitike po ndikojnë edhe rajonin tonë. Bashkimi Evropian po zgjeron ndikimin e tij në Ballkanin Perëndimor, ndërsa marrëdhëniet transatlantike mbeten të rëndësishme. Konfliktet globale dhe ndryshimet klimatike janë temat që dominojnë axhendën botërore.",
    europa:
      "Bashkimi Evropian po intensifikon përpjekjet për zgjerimin në Ballkanin Perëndimor. Kosova vazhdon rrugëtimin drejt anëtarësimit, me reforma në drejtësi dhe sundimin e ligjit si kushte kryesore. Liberalizimi i vizave mbetet një nga objektivat më të rëndësishme për qytetarët kosovarë.",
    nato:
      "Aspirata e Kosovës për anëtarësim në NATO vazhdon të jetë një objektiv strategjik. Forca e Sigurisë së Kosovës po modernizohet sipas standardeve të NATO-s. Prania e KFOR-it vazhdon të siguroj stabilitetin, ndërsa diskutimet për anëtarësim mbeten aktuale.",
  },
};

// SSE event helper
function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function pickResponse(categoryId: string, message: string): string {
  const pool = CATEGORY_RESPONSES[categoryId] ?? CATEGORY_RESPONSES["cat-1"];
  const lower = message.toLowerCase();

  // Try to match a topic-specific response within the category
  for (const [key, text] of Object.entries(pool)) {
    if (key !== "default" && lower.includes(key)) return text;
  }

  return pool.default;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const userMessage: string = body.message ?? "";
  const categoryId: string = body.categoryId ?? "cat-1";

  const responseText = pickResponse(categoryId, userMessage);
  const tokens = responseText.split(/(?<=\s)|(?=\s)/);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Phase 1 — thinking
      controller.enqueue(
        encoder.encode(sseEvent("status", { state: "thinking" }))
      );
      await delay(1500 + Math.random() * 1000);

      // Phase 2 — generating tokens
      controller.enqueue(
        encoder.encode(sseEvent("status", { state: "generating" }))
      );

      for (const token of tokens) {
        controller.enqueue(
          encoder.encode(sseEvent("token", { text: token }))
        );
        await delay(45 + Math.random() * 100);
      }

      // Phase 3 — done
      controller.enqueue(
        encoder.encode(
          sseEvent("status", { state: "done", fullText: responseText })
        )
      );
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
