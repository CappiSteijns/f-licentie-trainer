#!/usr/bin/env python3
"""Flashcards, naslag en feiten-/formulespel voor H16 (storing en immuniteit). Gebruik: python tools/cards_h16.py"""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
src = Path(__file__).with_name('cards_h1718.py').read_text(encoding='utf-8')
exec(src[src.index('def build('):src.index('build(17, C17')])

C16 = [
("s3","Wat is blokkering?","Een sterk storend signaal aan de ingang drukt door gelijkrichting de HF-/MF-versterker dicht: het werkpunt verschuift (gate wordt negatief) en de versterking daalt. Het storende signaal kan op een andere frequentie zitten."),
("s3","Hoe ontstaat het werkpunt-verschuiven bij blokkering?","Bij een sterk signaal gaat er gatestroom lopen in de positieve helft; in de negatieve helft spert de diode. De gate wordt negatief en de FET wordt (meer of minder) afgeknepen."),
("s3","Wat is oversturing van een ontvanger?","Te veel inkomend signaal: de ingangstrap of mengtrap wordt overbelast."),
("s4","Hoe ontstaat interferentie?","Door menging van signalen in een niet-lineaire versterker of door harmonischen van een zender die in de buurt van een andere ontvanger vallen."),
("s4","Welke harmonische van 144 MHz valt in de UHF-TV-band?","De vierde harmonische: 576 MHz, in kanaal 34 (574–582 MHz)."),
("s4","Een 21 MHz-zender stoort TV op 61–68 MHz. Waarom?","De derde harmonische van 21 MHz is 63 MHz: die valt in kanaal 4."),
("s5","Wanneer treedt intermodulatie op?","Als de som- of verschilfrequentie van twee sterke signalen (of hun harmonischen) gelijk is aan de beluisterde frequentie. Het is een gevolg van niet-lineariteit in het ingangscircuit (HF- en mengtrap)."),
("s5","Kun je intermodulatie met een filter verhelpen?","Nee: onderdrukt het filter de storende frequentie, dan ook de beluisterde. Je moet de niet-lineariteit (oversturing) verminderen."),
("s5","Welke intermodulatieproducten geven twee signalen f1 en f2?","2·f1 − f2 en 2·f2 − f1 (derde orde), vlak bij de oorspronkelijke frequenties."),
("s5","Wat is kruismodulatie?","Er ontstaan geen nieuwe frequenties; de modulatie van het sterke storende signaal wordt overgedragen op het (zwakkere) beluisterde signaal."),
("s5","Wat is het verschil tussen intermodulatie en kruismodulatie?","Intermodulatie levert nieuwe frequenties (som, verschil), kruismodulatie draagt alleen de modulatie van het storende signaal over."),
("s5","Door wat ontstaat intermodulatie in een zender?","Door niet-lineariteit in de eindtrap."),
("s6","Wat is laagfrequentdetectie (LFD, LF-inpraten)?","Een HF-signaal wordt in het audiodeel (halfgeleider of buis) gelijkgericht: AM-detectie. Het gebeurt in apparatuur die onvoldoende is afgeschermd."),
("s6","Hoe klinkt LFD van AM, EZB/DZB, CW en FM?","AM: verstaanbare spraak. EZB/DZB: onverstaanbare, vervormde spraak in het ritme van de stem. CW: plop/onderbrekingen in het seintempo. FM: hooguit geluidsvermindering, zelf geen geluid."),
("s6","Welke modulatievorm geeft de minste storing door LFD?","Frequentiemodulatie (FM)."),
("s6","Wat doen EZB-signalen bij LFD?","Ze klinken als onverstaanbare vervormde spraak in het ritme van de stem."),
("s6","Wat betekent het CE-keurmerk voor storing?","Het apparaat voldoet aan de EMC-richtlijnen (elektromagnetische compatibiliteit) en hoort bij een bepaalde veldsterkte normaal te werken."),
("s7","Wat is faseruis?","Een onstabiele oscillator in de zender zendt aan weerszijden van de frequentie een breder of smaller frequentiegebied (wolk) aan ruis uit. Het stoort ontvangst naast de zendfrequentie."),
("s7","Wat is chirp?","Bij CW: tijdelijke parasitaire oscillatie bij het indrukken van de sleutel; het signaal klinkt als een tjirpgeluid."),
("s7","Wat is tjoep?","De hoorbare frequentieverandering als de oscillator na het indrukken van de sleutel op gang komt."),
("s7","Welke twee oorzaken van chirp zijn er?","Een onvoldoende gestabiliseerde voedingsspanning van de oscillator en de oscillator die bij elk CW-teken in- en uitgeschakeld wordt."),
("s9","Hoe neemt de veldsterkte af met de afstand?","Lineair: tweemaal de afstand is tweemaal zo kleine veldsterkte (V/m en A/m). De vermogensdichtheid (W/m²) neemt kwadratisch af."),
("s9","In welke richting is de kans op storing het grootst?","In de stralingsrichting van de antenne (bijvoorbeeld de hoofdrichting van een Yagi)."),
("s9","Waarom stoort een Yagi in een bepaalde richting wel een CE-gekeurde CD-speler?","De veldsterkte in de stralingsrichting (ERP) is hoog; de speler wordt door de hoge veldsterkte gestoord."),
("s10","Wat zijn ongewenste (parasitaire) uitstralingen?","Alles buiten de bandbreedte van de draaggolf en de noodzakelijke modulatieproducten: oscillatorfrequenties, onbedoelde som- en verschilfrequenties, harmonischen en faseruis."),
("s10","In welke eindtrapklasse ontstaan de minste en de meeste harmonischen?","Het minst in klasse A, het meest in klasse C."),
("s10","Wat is splatter?","Een te grote bandbreedte van het zendsignaal, bijvoorbeeld door overmodulatie of door oversturen van de eindtrap."),
("s10","Wat gebeurt er bij oversturen van de eindtrap van een EZB-zender?","De signalen klinken vervormd en nemen meer bandbreedte in beslag."),
("s10","Wat veroorzaakt splatter bij een SSB-zender die niet te ver wordt uitgestuurd?","Parasitair oscilleren van de eindtrap, of een versterkertrap na het zijbandfilter die wordt overstuurd."),
("s10","Hoe verklein je harmonische uitstraling?","Minder uitsturen, een eindtrap in klasse A, en een laagdoorlaatfilter tussen zender en antenne."),
("s11","Via welke wegen komt HF in andere apparatuur?","Antennes en antenneleidingen, netsnoeren, CD-/DVD-/gramofoonaansluitingen, luidsprekersnoeren en instraling op de printplaat."),
("s11","Wat veroorzaakt stoorsignalen via de antenne en via de overige wegen?","Via de antenne: interferentie, intermodulatie of blokkering. Via de andere vier wegen: meestal laagfrequentdetectie."),
("s12","Algemene regels om storing te voorkomen?","Beperk het zendvermogen, zorg voor goede aanpassing, gebruik een balun om mantelstromen te voorkomen en een symmetrische aansluiting bij een eindgevoede antenne; een midden gevoede antenne geeft minder problemen."),
("s12","Waarvoor dient een kunstantenne (dummyload)?","Om een zender te belasten zonder signalen uit te stralen, bijvoorbeeld bij afstellen of testen."),
("s12","Wat doe je als je zender te sterke harmonischen uitstraalt en je buurman last heeft?","Op die band niet zenden tot de storing is verholpen."),
("s14","Welk filter achter de zender onderdrukt harmonischen?","Een laagdoorlaatfilter (pi- of T-filter) zo dicht mogelijk bij de zenderuitgang."),
("s14","Wat is het goede T-filter voor het onderdrukken van harmonischen?","Twee spoelen in de signaalweg met een condensator als middenaftakking naar massa (LCL)."),
("s14","Wat doet een ferrietklem op een coaxkabel?","Door de hoge permeabiliteit verhoogt hij de zelfinductie van de mantel en onderdrukt zo mantelstromen."),
("s14","Wat is het verschil tussen een zuigkring en een sperkring?","Zuigkring: LC-serieschakeling tussen antenne-ingang en aarde. Sperkring: LC-parallelkring in de signaalleiding. Beide afgestemd op de storende frequentie."),
("s14","Welk filter gebruik je als de storende frequentie hoger is dan de gewenste?","Een laagdoorlaatfilter tussen antenne en ontvanger. Is de storing lager in frequentie: een hoogdoorlaatfilter."),
("s14","Een HF-zender stoort alle TV-kanalen via een breedband-antenneversterker. Wat helpt?","Een hoogdoorlaatfilter vóór de versterker (de HF-zender zit lager in frequentie dan TV)."),
("s14","Waarom is een filter voor een FM-relais op de ontvangeringang en de zenderuitgang nodig?","Ingang: voorkomt blokkering door de eigen zenderdraaggolf. Uitgang: voorkomt ontvangststoring door faseruis van de zender (duplexfilter)."),
("s15","Hoe ontkoppel je het lichtnet?","Met een netfilter: een platte keramische condensator van 1–10 nF (≥ 1 kV) over de netaansluiting, eventueel een ferrietringkern met het snoer erdoor gewikkeld."),
("s15","Hoe ontkoppel je luidsprekerleidingen tegen LFD?","Met een condensator van ongeveer 1–10 nF (plat keramisch) tussen de twee aders, dicht bij de aansluiting. XC bij de storende frequentie ongeveer 1 Ω of minder."),
("s15","Hoe merk je dat de storing via de luidsprekerleiding binnenkomt?","Het volume van de storing reageert niet op de volumeregelaar."),
("s15","Hoe merk je dat de storing via een signaalleiding binnenkomt?","Het geluidsvolume van de storing reageert op de volumeregelaar."),
("s15","Waar ontstaat de LFD in een versterker?","In het eerste versterkende element: de emitter-basisdiode, de gate-sourcediode of stuurrooster/kathode."),
("s15","Hoe groot is de ontkoppelcondensator bij een hoogohmige ingang?","XC voor de storende frequentie ongeveer 10 keer lager dan Zsign: C ≈ 10 / (2π · f · Zsign)."),
("s15","Welke condensator werkt bij een bipolaire transistor (laagohmige ingang)?","Een platte keramische van ongeveer 3–10 nF, maar kleiner als hoge audiofrequenties worden gedempt."),
("s15","Wat doe je naast de ontkoppel-C in de signaalleiding?","Een ferrietkraal of een weerstand van enkele honderden ohm in de signaalleiding, of een HF-smoorspoel in de emitter-, source- of kathodeleiding."),
("s16","Wat is afschermen (inblikken)?","Het EM-veld binnen een apparaat beperken (zender afschermen) of een veld van buitenaf buiten houden (bijvoorbeeld de kast van binnen met geaarde aluminiumfolie)."),
("s16","Wat is een doorvoercondensator?","Een condensator waarvan de buitenkant een elektrode is (aan de wand) en de doorgevoerde leiding de andere; voor voedingsleidingen door een afscherming."),
("s17","Hoe voorkom je chirp en tjoep?","De voedingsspanning van de oscillator stabiliseren, de oscillator mechanisch solide bouwen en afschermen, en de oscillator continu laten lopen met de sleutel op een buffer-/schakeltrap erna."),
("s17","Hoe voorkom je sleutelklikken?","Het HF-signaal geleidelijk laten in- en uitschakelen (afgeronde flanken), en niet in de oscillator keyen."),
]

F16 = [
{"title":"Harmonischen en intermodulatie","items":[
 {"f":"n-de harmonische = n · f","t":"21 MHz × 3 = 63 MHz (TV kanaal 4); 144 MHz × 4 = 576 MHz"},
 {"f":"IM3: 2·f₁ − f₂ en 2·f₂ − f₁","t":"derde-orde intermodulatieproducten vlak naast f₁ en f₂"}]},
{"title":"Ontkoppelen","items":[
 {"f":"C ≈ 10 / (2π · f · Zsign)","t":"XC is ongeveer 10 keer kleiner dan de signaalimpedantie (hoogohmige ingang)"},
 {"f":"XC = 1 / (2π · f · C) ≈ 1 Ω","t":"bij luidsprekerontkoppeling, C ongeveer 1–10 nF"}]},
{"title":"Veldsterkte","items":[
 {"f":"E ~ 1 / afstand","t":"2× de afstand: halve veldsterkte (V/m en A/m)"},
 {"f":"S = E · H ~ 1 / afstand²","t":"vermogensdichtheid in W/m²"}]},
]

DR16 = [
{"id":"imd","sec":"s5","name":"Intermodulatieproducten","where":"de frequenties van intermodulatie van twee sterke signalen","f":"2·f₁ − f₂ en 2·f₂ − f₁",
 "cloze":[("Intermodulatie van de derde orde geeft producten op 2·f₁ − f₂ en ___","2·f₂ − f₁",["f₁ + f₂","f₂ − f₁","3·f₁"])],"gen":"imd"},
{"id":"harm","sec":"s4","name":"Harmonischen van een zender","where":"de frequentie van de n-de harmonische","f":"n · f",
 "cloze":[("De derde harmonische van 21 MHz ligt op ___ MHz","63",["42","7","84"])],"gen":"harm"},
{"id":"cdec","sec":"s15","name":"Ontkoppelcondensator tegen LFD","where":"de waarde van de ontkoppelcondensator bij de signaalingang","f":"C ≈ 10 / (2π · f · Zsign)",
 "cloze":[("Bij hoogohmige ingangen moet XC ongeveer ___ keer kleiner zijn dan Zsign","10",["2","100","1"])],"gen":"cdec"},
{"id":"lfd","sec":"s6","name":"LFD per modulatievorm","where":"hoe laagfrequentdetectie klinkt per soort zender","f":None,
 "ask":"Hoe klinkt LFD bij {x}?","askRev":"Welke modulatievorm geeft dit bij LFD: {x}?",
 "pairs":[["AM","verstaanbare spraak"],["EZB of DZB","vervormde, onverstaanbare spraak in het ritme van de stem"],["CW","plop/onderbrekingen in het seintempo"],["FM","nauwelijks hoorbaar (minste storing)"]],"rev":True},
{"id":"soort","sec":"s3","name":"Soorten storing","where":"het verschil tussen blokkering, intermodulatie en andere storing","f":None,
 "ask":"Wat is {x}?","askRev":"Welke storing is dit: {x}?",
 "pairs":[["blokkering","een sterk signaal drukt de versterker dicht en verschuift het werkpunt"],["intermodulatie","som- of verschilfrequenties van sterke signalen vallen op de beluisterde frequentie"],["kruismodulatie","de modulatie van het sterke signaal wordt overgedragen op het zwakke signaal"],["laagfrequentdetectie","gelijkrichting van HF in het audiodeel"],["faseruis","een ruiswolk naast de zendfrequentie door een onstabiele oscillator"],["chirp","tijdelijke parasitaire oscillatie bij het indrukken van de sleutel"]],"rev":True},
{"id":"maat","sec":"s14","name":"Maatregel tegen storing","where":"welk filter of welke maatregel bij welke storing","f":None,
 "ask":"Wat helpt tegen {x}?","askRev":"Waartegen helpt dit: {x}?",
 "pairs":[["harmonischen van de zender","een laagdoorlaatfilter tussen zender en antenne"],["een storende zender lager in frequentie dan de TV","een hoogdoorlaatfilter in de antenneleiding"],["LFD via de luidsprekerleiding","een condensator van 1–10 nF over de leiding"],["LFD via het lichtnet","een netfilter met condensator en ferriet"],["mantelstromen op de coax","een ferrietklem of balun"],["chirp","de voedingsspanning van de oscillator stabiliseren"],["sleutelklikken","het HF-signaal geleidelijk laten in- en uitschakelen"],["storing door een te sterk signaal op de ingang","een zuigkring, sperkring of ander filter vóór de ingang"]],"rev":True},
{"id":"ontk","sec":"s15","name":"Ontkoppelen van leidingen","where":"de ontkoppelmiddelen per leiding","f":None,
 "ask":"Waarmee ontkoppel je {x}?","askRev":"Welke leiding is dit: {x}?",
 "pairs":[["het lichtnet","platte keramische condensator van 1–10 nF (≥ 1 kV) en een ferrietring"],["de luidsprekerleiding","een condensator van circa 1–10 nF tussen de aders"],["een audio-signaalleiding","een condensator, ferrietkraal of weerstand in de leiding"],["de ingang van een transistor","een condensator van 3–10 nF"],["de ingang van een FET of buis","een condensator van ongeveer 10 / (2π f Zsign)"]],"rev":True},
{"id":"uitstr","sec":"s10","name":"Ongewenste uitstralingen","where":"de oorzaken van parasitaire uitstraling","f":None,
 "ask":"Wat veroorzaakt {x}?","askRev":"Waardoor ontstaat dit: {x}?",
 "pairs":[["splatter","overmodulatie of oversturing van de eindtrap"],["harmonischen","niet-lineariteit van de eindtrap, het meest in klasse C"],["de minste harmonischen","een eindtrap in klasse A"],["bandbreedte groter dan de zijbandfilterbreedte","een versterkertrap na het zijbandfilter wordt overstuurd"],["oscillatorfrequenties","onvoldoende filtering of afscherming in de zender"]],"rev":True},
{"id":"chirp","sec":"s7","name":"Chirp, tjoep en klikken","where":"maatregelen tegen de CW-storingen","f":None,
 "ask":"Wat hoort bij {x}?","askRev":"Welk verschijnsel is dit: {x}?",
 "pairs":[["chirp","oscillator slecht gestabiliseerd of in-/uitgeschakeld met de sleutel"],["tjoep","hoorbare frequentieverandering na het indrukken van de sleutel"],["sleutelklikken","te abrupt in- en uitschakelen van het HF-signaal"],["voorkomen van chirp","de oscillator continu laten lopen en de sleutel op een buffertrap laten werken"]],"rev":True},
{"id":"afsch","sec":"s16","name":"Afschermen","where":"hoe je een EM-veld binnen of buiten houdt","f":None,
 "ask":"Wat is {x}?","askRev":"Welk middel is dit: {x}?",
 "pairs":[["inblikken","oscillatoren en andere HF-delen afschermen met een metalen doosje"],["een doorvoercondensator","voedingsleiding door de wand voeren zonder HF te laten passeren"],["afgeschermde kabel","voor signaalleidingen, de afscherming wordt aan het schotje gesoldeerd"],["aluminiumfolie in de kast","aan de binnenkant geaard, houdt instraling van buiten tegen"]],"rev":True},
{"id":"veld","sec":"s9","name":"Veldsterkte en afstand","where":"hoe de veldsterkte afneemt","f":None,
 "ask":"Wat gebeurt er met {x} bij een dubbele afstand?","askRev":"Welke grootheid is dit: {x}?",
 "pairs":[["de elektrische veldsterkte (V/m)","wordt twee keer zo klein"],["de magnetische veldsterkte (A/m)","wordt twee keer zo klein"],["de vermogensdichtheid (W/m²)","wordt vier keer zo klein"]],"rev":True},
]

RW16 = {
"cdec":[("C ≈ 10 / (2π · f · Zsign)","Zsign","Zsign ≈ 10 / (2π · f · C)",["Zsign ≈ 2π · f · C / 10","Zsign ≈ 10 · 2π · f · C","Zsign ≈ C / (10 · 2π · f)"])],
}

build(16, C16, F16, DR16, RW16)
