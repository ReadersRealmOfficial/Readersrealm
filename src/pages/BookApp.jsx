import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase } from "../lib/supabase.js";
import GuestPrompt from "../components/GuestPrompt.jsx";

// Analytics are loaded natively in index.html (GTM + gtag)

// ─── Set your own email here so YOUR activity is never tracked ───
const OWNER_EMAIL = "l.a.t.mustapha@gmail.com"; // ← replace with your actual email address

// Save event to Supabase so admin sees ALL users (not just your browser)
const saveEvent = async (eventName, properties = {}) => {
  try {
    await supabase.from("analytics_events").insert({
      event_name: eventName,
      page: window.location.pathname,
      properties,
    });
  } catch {}
};

// trackFilter — skips owner email, saves to GA + Supabase
const trackFilter = (filterName, value) => {
  if (user?.email === OWNER_EMAIL) return;
  trackGA("filter_used", { filter: filterName, value: String(value) });
  saveEvent("filter_used", { filter: filterName, value: String(value) });
};

// ─── Color Palette ───
const C = {
  darkPurple: "#2B1E2F",
  copper: "#C27A3A",
  cream: "#E8DCCB",
  darkBrown: "#4A2C23",
  teal: "#35605A",
  sage: "#5B6C5D",
};

// Analytics tracking helper
const trackEvent = (action, details = {}) => {
  const events = JSON.parse(localStorage.getItem("rr_events") || "[]");
  events.push({ action, ...details, timestamp: new Date().toISOString() });
  localStorage.setItem("rr_events", JSON.stringify(events));
};

// ─── 200 Book Database ───
export const BOOKS_DB = [
  { id:1, isbn:"9781649374042", title:"Fourth Wing", author:"Rebecca Yarros", rating:4.6, genres:["Fantasy","Romance","Romantasy","Fiction"], contentRating:"Adult", pages:517, words:143000, language:"English", series:{name:"The Empyrean",number:1,status:"Ongoing"}, description:"Violet Sorrengail was supposed to enter the Scribe Quadrant. Now her mother has forced her into the Riders Quadrant, where students bond with dragons or die trying.", warnings:["Violence","Death","Graphic Sexual Content","Intense Violence","Blood","Poisoning","Strong Language","Ableism","Bullying","Animal Death","PTSD","Chronic Illness"], tropes:["Enemies to Lovers","Forced Proximity","Strong Female Lead","Slow Burn","Found Family"], tags:["Romance","Adventure","Action","School Setting","Epic","Dragons"] },
  { id:2, isbn:"9780547928210", title:"The Fellowship of the Ring", author:"J.R.R. Tolkien", rating:4.9, genres:["Fantasy","Fiction"], contentRating:"All Ages", pages:423, words:187000, language:"English", series:{name:"The Lord of the Rings",number:1,status:"Completed"}, description:"In ancient times the Rings of Power were crafted by the Elven-smiths, and Sauron forged the One Ring, filling it with his own power so that he could rule all others.", warnings:["Violence","Death","War"], tropes:["Chosen One","Quest","Found Family","Mentor Figure"], tags:["Adventure","Epic","Good vs Evil","Friendship"] },
  { id:3, isbn:"9780590353427", title:"Harry Potter and the Sorcerer's Stone", author:"J.K. Rowling", rating:4.8, genres:["Fantasy","Fiction","YA"], contentRating:"Teen", pages:309, words:77000, language:"English", series:{name:"Harry Potter",number:1,status:"Completed"}, description:"Harry Potter has never been the star of a Quidditch team. He knows no spells, has never helped to hatch a dragon, and has never worn a cloak of invisibility. All he knows is a miserable life with the Dursleys.", warnings:["Violence","Bullying","Child Abuse","Death"], tropes:["Chosen One","Found Family","School Setting","Mentor Figure","Underdog"], tags:["Magic","Adventure","Friendship","School Setting","Coming of Age"] },
  { id:4, isbn:"9781627792127", title:"Six of Crows", author:"Leigh Bardugo", rating:4.8, genres:["Fantasy","YA","Fiction"], contentRating:"Teen", pages:465, words:137000, language:"English", series:{name:"Six of Crows",number:1,status:"Completed"}, description:"Criminal prodigy Kaz Brekker is offered a chance at a deadly heist that could make him rich beyond his wildest dreams. But he can't pull it off alone.", warnings:["Violence","Death","Trafficking","Addiction","PTSD","Strong Language"], tropes:["Found Family","Heist","Enemies to Lovers","Morally Grey Characters","Slow Burn"], tags:["Adventure","Romance","Action","Dark","Humor"] },
  { id:5, isbn:"9780441013593", title:"Dune", author:"Frank Herbert", rating:4.8, genres:["Sci-Fi","Fiction"], contentRating:"Adult", pages:688, words:188000, language:"English", series:{name:"Dune",number:1,status:"Completed"}, description:"Set on the desert planet Arrakis, Dune is the story of Paul Atreides, who would become the mysterious man known as Muad'Dib.", warnings:["Violence","Death","War","Drug Use","Political Violence"], tropes:["Chosen One","Political Intrigue","Coming of Age","Prophecy"], tags:["Space","Adventure","Political","Epic","Desert"] },
  { id:6, isbn:"9780756404741", title:"The Name of the Wind", author:"Patrick Rothfuss", rating:4.8, genres:["Fantasy","Fiction"], contentRating:"Teen", pages:662, words:259000, language:"English", series:{name:"The Kingkiller Chronicle",number:1,status:"Ongoing"}, description:"Told in Kvothe's own voice, this is the tale of the magically gifted young man who grows to be the most notorious wizard his world has ever seen.", warnings:["Violence","Death","Poverty","Bullying","Strong Language"], tropes:["Unreliable Narrator","Rags to Riches","School Setting","Slow Burn"], tags:["Adventure","Magic","Music","School Setting"] },
  { id:7, isbn:"9780765311788", title:"Mistborn: The Final Empire", author:"Brandon Sanderson", rating:4.7, genres:["Fantasy","Fiction"], contentRating:"Teen", pages:541, words:214000, language:"English", series:{name:"Mistborn",number:1,status:"Completed"}, description:"In a world where ash falls from the sky and mist dominates the night, an evil lord rules through terror. Vin discovers she has the powers of a Mistborn.", warnings:["Violence","Death","Slavery","Abuse"], tropes:["Chosen One","Found Family","Strong Female Lead","Heist","Mentor Figure"], tags:["Adventure","Action","Dark","Magic","Revolution"] },
  { id:8, isbn:"9780765326355", title:"The Way of Kings", author:"Brandon Sanderson", rating:4.7, genres:["Fantasy","Fiction"], contentRating:"Teen", pages:1007, words:383000, language:"English", series:{name:"The Stormlight Archive",number:1,status:"Ongoing"}, description:"Roshar is a world of stone and storms. Uncanny tempests sweep across the rocky terrain so frequently that they have shaped ecology and civilization alike.", warnings:["Violence","Death","War","Slavery","Mental Health","PTSD","Suicide Ideation"], tropes:["Multiple POV","Chosen One","Found Family","Slow Burn"], tags:["Epic","Adventure","War","Magic","Political"] },
  { id:9, isbn:"9780593135204", title:"Project Hail Mary", author:"Andy Weir", rating:4.8, genres:["Sci-Fi","Fiction"], contentRating:"Teen", pages:476, words:109000, language:"English", series:null, description:"Ryland Grace is the sole survivor on a desperate, last-chance mission — and if he fails, humanity and the earth itself will perish.", warnings:["Death","Isolation","Existential Threat"], tropes:["Lone Survivor","Fish Out of Water","Unlikely Friendship","Science Hero"], tags:["Space","Humor","Science","Survival","Aliens"] },
  { id:10, isbn:"9780735211292", title:"Atomic Habits", author:"James Clear", rating:4.8, genres:["Non-Fiction","Self-Help"], contentRating:"All Ages", pages:320, words:73000, language:"English", series:null, description:"No matter your goals, Atomic Habits offers a proven framework for improving every day with practical strategies for forming good habits and breaking bad ones.", warnings:[], tropes:[], tags:["Productivity","Psychology","Personal Development"] },
  { id:11, isbn:"9780812988406", title:"When Breath Becomes Air", author:"Paul Kalanithi", rating:4.7, genres:["Non-Fiction","Memoir"], contentRating:"All Ages", pages:228, words:55000, language:"English", series:null, description:"At the age of thirty-six, on the verge of completing a decade's worth of training as a neurosurgeon, Paul Kalanithi was diagnosed with stage IV lung cancer.", warnings:["Death","Terminal Illness","Grief"], tropes:[], tags:["Memoir","Inspirational","Medical","Philosophy"] },
  { id:12, isbn:"9780062024039", title:"Divergent", author:"Veronica Roth", rating:4.2, genres:["YA","Sci-Fi","Fiction"], contentRating:"Teen", pages:487, words:105000, language:"English", series:{name:"Divergent",number:1,status:"Completed"}, description:"In a futuristic Chicago, society is divided into five factions. At sixteen, Beatrice Prior must choose her faction — and discovers she is Divergent, threatening the system's control.", warnings:["Violence","Intense Violence","Death","Injections/Needles","Mind Control","Bullying","War","Grief","Oppressive Government"], tropes:["Chosen One","Dystopia","Strong Female Lead","Love Interest","Coming of Age"], tags:["Action","Adventure","Dark","Romance","Revolution","Futuristic"] },
  { id:13, isbn:"9780439023481", title:"The Hunger Games", author:"Suzanne Collins", rating:4.5, genres:["YA","Sci-Fi","Fiction"], contentRating:"Teen", pages:374, words:100000, language:"English", series:{name:"The Hunger Games",number:1,status:"Completed"}, description:"In the ruins of a place once known as North America lies the nation of Panem, where the Capitol keeps the districts in line by forcing them to participate in the annual Hunger Games.", warnings:["Violence","Intense Violence","Death","Child Death","Starvation","PTSD","War","Oppressive Government"], tropes:["Strong Female Lead","Dystopia","Love Triangle","Survival","Coming of Age"], tags:["Action","Adventure","Dark","Romance","Revolution"] },
  { id:14, isbn:"9781619634442", title:"A Court of Thorns and Roses", author:"Sarah J. Maas", rating:4.5, genres:["Fantasy","Romance","Fiction"], contentRating:"Adult", pages:419, words:117000, language:"English", series:{name:"A Court of Thorns and Roses",number:1,status:"Ongoing"}, description:"When nineteen-year-old huntress Feyre kills a wolf in the woods, a terrifying creature arrives to demand retribution, dragging her to a treacherous magical land.", warnings:["Graphic Sexual Content","Violence","Death","Abuse","PTSD","Strong Language"], tropes:["Enemies to Lovers","Beauty and the Beast","Strong Female Lead","Slow Burn","Fae"], tags:["Romance","Adventure","Magic","Dark","Epic"] },
  { id:15, isbn:"9780553418026", title:"The Martian", author:"Andy Weir", rating:4.7, genres:["Sci-Fi","Fiction"], contentRating:"Teen", pages:369, words:104000, language:"English", series:null, description:"Six days ago, astronaut Mark Watney became one of the first people to walk on Mars. Now, he's sure he'll be the first person to die there.", warnings:["Isolation","Injury","Strong Language","Near-Death Experiences"], tropes:["Lone Survivor","Science Hero","Man vs Nature"], tags:["Space","Humor","Science","Survival"] },
  { id:16, isbn:"9780141439518", title:"Pride and Prejudice", author:"Jane Austen", rating:4.7, genres:["Fiction","Romance","Classics"], contentRating:"All Ages", pages:279, words:122000, language:"English", series:null, description:"One of the most popular novels in the English language, portraying life in genteel rural society and the initial misunderstandings between Elizabeth Bennet and Mr. Darcy.", warnings:[], tropes:["Enemies to Lovers","Slow Burn","Strong Female Lead","Class Differences","Misunderstanding"], tags:["Romance","Humor","Social Commentary","Historical"] },
  { id:17, isbn:"9780451524935", title:"1984", author:"George Orwell", rating:4.7, genres:["Fiction","Sci-Fi","Classics"], contentRating:"Adult", pages:328, words:89000, language:"English", series:null, description:"Among the seminal texts of the 20th century, Nineteen Eighty-Four is a rare work that grows more haunting as its dystopian purgatory becomes more real.", warnings:["Violence","Torture","Oppressive Government","Strong Language","Sexual Content","Death","Psychological Abuse"], tropes:["Dystopia","Forbidden Love","Rebellion"], tags:["Political","Dark","Philosophical","Futuristic"] },
  { id:18, isbn:"9780062060624", title:"The Song of Achilles", author:"Madeline Miller", rating:4.6, genres:["Fiction","Fantasy","Romance"], contentRating:"Adult", pages:378, words:90000, language:"English", series:null, description:"A tale of gods, kings, immortal fame, and the human heart, brilliantly reimagining Homer's enduring masterwork, The Iliad.", warnings:["Violence","Death","War","Grief","Sexual Content"], tropes:["Star-Crossed Lovers","Friends to Lovers","Slow Burn","Tragic Ending"], tags:["Romance","Mythology","LGBTQ+","Historical","Epic"] },
  { id:19, isbn:"9780399590504", title:"Educated", author:"Tara Westover", rating:4.7, genres:["Non-Fiction","Memoir"], contentRating:"Adult", pages:334, words:97000, language:"English", series:null, description:"Born to survivalists in the mountains of Idaho, Tara Westover was seventeen the first time she set foot in a classroom. Her struggle for knowledge transformed her.", warnings:["Abuse","Violence","Mental Health","Neglect","Injury"], tropes:[], tags:["Inspirational","Memoir","Education","Family"] },
  { id:20, isbn:"9780547928227", title:"The Hobbit", author:"J.R.R. Tolkien", rating:4.8, genres:["Fantasy","Fiction"], contentRating:"All Ages", pages:310, words:95000, language:"English", series:null, description:"Bilbo Baggins is a hobbit who enjoys a comfortable life, rarely traveling far. But his contentment is disturbed when Gandalf the wizard and a company of dwarves arrive.", warnings:["Violence","Death"], tropes:["Quest","Unlikely Hero","Mentor Figure","Found Family"], tags:["Adventure","Magic","Dragons","Friendship"] },
  { id:21, isbn:"9780060883287", title:"Cien años de soledad", author:"Gabriel García Márquez", rating:4.7, genres:["Fiction","Classics"], contentRating:"Adult", pages:417, words:132000, language:"Spanish", series:null, description:"La novela narra la historia de la familia Buendía a lo largo de siete generaciones en el pueblo ficticio de Macondo, una obra maestra del realismo mágico.", warnings:["Violence","Death","Sexual Content","Incest","War"], tropes:["Multi-Generational","Magical Realism","Fate"], tags:["Family","Historical","Magical","Political"] },
  { id:22, isbn:"9781984822178", title:"Normal People", author:"Sally Rooney", rating:4.1, genres:["Fiction","Romance"], contentRating:"Adult", pages:273, words:67000, language:"English", series:null, description:"Connell and Marianne grow up in the same small town in the west of Ireland, developing a strange and intense connection.", warnings:["Sexual Content","Self-Harm","Abuse","Bullying","Depression","Strong Language"], tropes:["Friends to Lovers","Will They/Won't They","Miscommunication","Slow Burn"], tags:["Romance","Literary","Coming of Age","Contemporary"] },
  { id:23, isbn:"9781250301697", title:"The Silent Patient", author:"Alex Michaelides", rating:4.2, genres:["Fiction","Thriller"], contentRating:"Adult", pages:325, words:77000, language:"English", series:null, description:"Alicia Berenson fires five shots into her husband's face — and never speaks another word. A criminal psychotherapist becomes obsessed with uncovering her motive.", warnings:["Violence","Death","Mental Health","Self-Harm","Gun Violence","Psychological Abuse"], tropes:["Unreliable Narrator","Plot Twist","Obsession"], tags:["Mystery","Psychological","Dark","Suspense"] },
  { id:24, isbn:"9780316556347", title:"Circe", author:"Madeline Miller", rating:4.6, genres:["Fiction","Fantasy"], contentRating:"Adult", pages:393, words:100000, language:"English", series:null, description:"In the house of Helios, a daughter is born. Circe is a strange child — not powerful like her father. She discovers a power forbidden to the gods: witchcraft.", warnings:["Violence","Sexual Assault","Death","Isolation"], tropes:["Strong Female Lead","Coming of Age","Slow Burn","Transformation"], tags:["Mythology","Feminist","Adventure","Magic"] },
  { id:25, isbn:"9780743273565", title:"The Great Gatsby", author:"F. Scott Fitzgerald", rating:4.3, genres:["Fiction","Classics"], contentRating:"Teen", pages:180, words:47000, language:"English", series:null, description:"The story of the fabulously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan, of lavish parties on Long Island.", warnings:["Violence","Death","Alcoholism","Infidelity"], tropes:["Unrequited Love","Rags to Riches","Tragedy"], tags:["Historical","Romance","Social Commentary","Literary"] },
  { id:26, isbn:"9781649374172", title:"Iron Flame", author:"Rebecca Yarros", rating:4.4, genres:["Fantasy","Romance","Romantasy","Fiction"], contentRating:"Adult", pages:623, words:175000, language:"English", series:{name:"The Empyrean",number:2,status:"Ongoing"}, description:"Everyone expected Violet Sorrengail to die during her first year at Basgiath War College. Now the real war begins.", warnings:["Violence","Death","Graphic Sexual Content","Intense Violence","Blood","War","PTSD","Chronic Illness","Strong Language"], tropes:["Enemies to Lovers","Forced Proximity","Strong Female Lead","Found Family"], tags:["Romance","Adventure","Action","Dragons","Epic","Dark"] },
  { id:27, isbn:"9781984806734", title:"Beach Read", author:"Emily Henry", rating:4.1, genres:["Fiction","Romance"], contentRating:"Adult", pages:361, words:90000, language:"English", series:null, description:"A romance writer who no longer believes in love and a literary writer stuck in a rut engage in a summer-long challenge.", warnings:["Grief","Infidelity","Sexual Content","Strong Language"], tropes:["Enemies to Lovers","Forced Proximity","Dual POV","Slow Burn"], tags:["Romance","Humor","Contemporary","Summer"] },
  { id:28, isbn:"9780062316097", title:"Sapiens", author:"Yuval Noah Harari", rating:4.6, genres:["Non-Fiction","History"], contentRating:"All Ages", pages:443, words:130000, language:"English", series:null, description:"How did our species succeed in the battle for dominance? A groundbreaking narrative of humanity's creation and evolution.", warnings:[], tropes:[], tags:["History","Science","Philosophy","Anthropology"] },
  { id:29, isbn:"9780316310277", title:"The Cruel Prince", author:"Holly Black", rating:4.3, genres:["Fantasy","YA","Fiction"], contentRating:"Teen", pages:370, words:98000, language:"English", series:{name:"The Folk of the Air",number:1,status:"Completed"}, description:"Jude was seven when her parents were murdered and she was stolen away to the treacherous High Court of Faerie.", warnings:["Violence","Death","Bullying","Poisoning","Murder","Blood"], tropes:["Enemies to Lovers","Strong Female Lead","Morally Grey Characters","Fae","Slow Burn"], tags:["Romance","Adventure","Dark","Magic","Political"] },
  { id:30, isbn:"9780735219090", title:"Where the Crawdads Sing", author:"Delia Owens", rating:4.5, genres:["Fiction","Mystery"], contentRating:"Adult", pages:368, words:96000, language:"English", series:null, description:"For years, rumors of the 'Marsh Girl' have haunted Barkley Cove. When the popular Chase Andrews is found dead, the locals immediately suspect Kya.", warnings:["Death","Abuse","Neglect","Sexual Content","Abandonment"], tropes:["Coming of Age","Mystery","Outcast"], tags:["Mystery","Nature","Romance","Literary","Southern"] },
  { id:31, isbn:"9780060935467", title:"To Kill a Mockingbird", author:"Harper Lee", rating:4.8, genres:["Fiction","Classics"], contentRating:"Teen", pages:281, words:100000, language:"English", series:null, description:"The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it. Through the young eyes of Scout and Jem Finch.", warnings:["Racism","Violence","Death","Sexual Assault","Injustice"], tropes:["Coming of Age","Mentor Figure","Innocence Lost"], tags:["Social Commentary","Historical","Legal","Family","Southern"] },
  { id:32, isbn:"9780375842207", title:"The Book Thief", author:"Markus Zusak", rating:4.6, genres:["Fiction","YA","Classics"], contentRating:"Teen", pages:552, words:118000, language:"English", series:null, description:"It is 1939 Nazi Germany. The country is holding its breath. Death has never been busier, and will become busier still. Liesel Meminger is a foster girl living outside of Munich.", warnings:["Death","War","Violence","Grief","Bombing"], tropes:["Unreliable Narrator","Coming of Age","Found Family"], tags:["Historical","War","Friendship","Dark","Literary"] },
  { id:33, isbn:"9780062315007", title:"The Alchemist", author:"Paulo Coelho", rating:4.3, genres:["Fiction","Fantasy"], contentRating:"All Ages", pages:197, words:39000, language:"English", series:null, description:"Paulo Coelho's masterwork tells the mystical story of Santiago, an Andalusian shepherd boy who yearns to travel in search of a worldly treasure.", warnings:[], tropes:["Quest","Coming of Age","Mentor Figure"], tags:["Inspirational","Adventure","Philosophy","Spiritual"] },
  { id:34, isbn:"9781639731084", title:"Throne of Glass", author:"Sarah J. Maas", rating:4.3, genres:["Fantasy","YA","Fiction"], contentRating:"Teen", pages:404, words:99000, language:"English", series:{name:"Throne of Glass",number:1,status:"Completed"}, description:"After serving out a year of hard labor in the salt mines, assassin Celaena Sardothien is brought before the Crown Prince to compete for her freedom.", warnings:["Violence","Death","Slavery","Abuse","Strong Language"], tropes:["Strong Female Lead","Love Triangle","Chosen One","Slow Burn"], tags:["Adventure","Action","Romance","Magic","Dark"] },
  { id:35, isbn:"9780142424179", title:"The Fault in Our Stars", author:"John Green", rating:4.4, genres:["YA","Fiction","Romance"], contentRating:"Teen", pages:313, words:68000, language:"English", series:null, description:"Despite the tumor-shrinking medical miracle that has bought her a few years, Hazel has never been anything but terminal. Then Augustus Waters appears at Cancer Kid Support Group.", warnings:["Death","Terminal Illness","Grief","Depression"], tropes:["Star-Crossed Lovers","Tragic Ending","Coming of Age"], tags:["Romance","Contemporary","Inspirational","Coming of Age"] },
  { id:36, isbn:"9780307588371", title:"Gone Girl", author:"Gillian Flynn", rating:4.2, genres:["Fiction","Thriller","Mystery"], contentRating:"Adult", pages:432, words:145000, language:"English", series:null, description:"On a warm summer morning in North Carthage, Missouri, Nick Dunne reports that his wife Amy has gone missing. Under pressure, his portrait of a blissful union begins to crumble.", warnings:["Violence","Death","Psychological Abuse","Sexual Content","Strong Language","Manipulation"], tropes:["Unreliable Narrator","Plot Twist","Dual POV","Anti-Hero"], tags:["Mystery","Psychological","Dark","Suspense","Marriage"] },
  { id:37, isbn:"9780385490818", title:"The Handmaid's Tale", author:"Margaret Atwood", rating:4.4, genres:["Fiction","Sci-Fi","Classics"], contentRating:"Adult", pages:311, words:91000, language:"English", series:{name:"The Handmaid's Tale",number:1,status:"Completed"}, description:"Offred is a Handmaid in the Republic of Gilead. She may leave the home of the Commander and his wife once a day to walk to food markets. She must lie on her back once a month and pray that the Commander makes her pregnant.", warnings:["Sexual Assault","Oppressive Government","Violence","Death","Forced Pregnancy","Psychological Abuse"], tropes:["Dystopia","Strong Female Lead","Rebellion","Forbidden Love"], tags:["Political","Feminist","Dark","Futuristic"] },
  { id:38, isbn:"9780147514011", title:"Little Women", author:"Louisa May Alcott", rating:4.5, genres:["Fiction","Classics"], contentRating:"All Ages", pages:449, words:187000, language:"English", series:null, description:"Generations of readers young and old have fallen in love with the March sisters — Jo, Meg, Beth, and Amy — in this timeless classic.", warnings:["Death","Grief","Poverty"], tropes:["Coming of Age","Found Family","Strong Female Lead"], tags:["Family","Historical","Romance","Inspirational","Feminist"] },
  { id:39, isbn:"9780786838653", title:"Percy Jackson and the Lightning Thief", author:"Rick Riordan", rating:4.5, genres:["Fantasy","YA","Fiction"], contentRating:"All Ages", pages:377, words:87000, language:"English", series:{name:"Percy Jackson",number:1,status:"Completed"}, description:"Twelve-year-old Percy Jackson is about to be kicked out of boarding school... again. He discovers he's the son of Poseidon and sets out on a quest across the United States.", warnings:["Violence","Death","Bullying","Monsters"], tropes:["Chosen One","Quest","Found Family","Coming of Age","Mentor Figure"], tags:["Adventure","Mythology","Humor","Friendship","Action"] },
  { id:40, isbn:"9780385539258", title:"A Little Life", author:"Hanya Yanagihara", rating:4.4, genres:["Fiction"], contentRating:"Adult", pages:814, words:356000, language:"English", series:null, description:"When four classmates from a small Massachusetts college move to New York to make their way, they're still figuring out who they are. Decades later, their lives center around one of them: Jude.", warnings:["Self-Harm","Sexual Abuse","Child Abuse","Violence","Suicide","Drug Use","Trauma","Death"], tropes:["Found Family","Tragedy","Slow Burn"], tags:["Literary","LGBTQ+","Friendship","Dark","Contemporary"] },
  { id:41, isbn:"9781501161933", title:"The Seven Husbands of Evelyn Hugo", author:"Taylor Jenkins Reid", rating:4.5, genres:["Fiction","Romance"], contentRating:"Adult", pages:389, words:100000, language:"English", series:null, description:"Aging and reclusive Hollywood movie icon Evelyn Hugo is finally ready to tell the truth about her glamorous and scandalous life.", warnings:["Abuse","Death","Homophobia","Sexual Content","Racism"], tropes:["Unreliable Narrator","Multi-Generational","Strong Female Lead","Forbidden Love"], tags:["LGBTQ+","Historical","Romance","Hollywood","Literary"] },
  { id:42, isbn:"9781501110368", title:"It Ends with Us", author:"Colleen Hoover", rating:4.3, genres:["Fiction","Romance"], contentRating:"Adult", pages:376, words:97000, language:"English", series:{name:"It Ends with Us",number:1,status:"Completed"}, description:"Lily hasn't always had it easy, but that's never stopped her from working hard for the life she wants. When she falls for Ryle Kincaid, everything seems too good to be true.", warnings:["Domestic Violence","Abuse","Sexual Content","Strong Language","Child Abuse"], tropes:["Love Triangle","Dual POV","Strong Female Lead"], tags:["Romance","Contemporary","Dark","Emotional"] },
  { id:43, isbn:"9780525559474", title:"The Midnight Library", author:"Matt Haig", rating:4.3, genres:["Fiction","Fantasy"], contentRating:"All Ages", pages:288, words:70000, language:"English", series:null, description:"Between life and death there is a library. Nora Seed finds herself in the Midnight Library, where she can try out different lives she could have lived.", warnings:["Suicide","Depression","Death","Mental Health"], tropes:["What If","Second Chance","Transformation"], tags:["Philosophical","Inspirational","Fantasy","Contemporary"] },
  { id:44, isbn:"9780765387561", title:"The Invisible Life of Addie LaRue", author:"V.E. Schwab", rating:4.4, genres:["Fantasy","Fiction","Romance"], contentRating:"Adult", pages:444, words:112000, language:"English", series:null, description:"A woman makes a Faustian bargain to live forever but is cursed to be forgotten by everyone she meets. Then, one day, a young man in a bookshop remembers her.", warnings:["Sexual Content","Death","Manipulation","Isolation"], tropes:["Slow Burn","Star-Crossed Lovers","Immortality","Deal with the Devil"], tags:["Romance","Historical","Fantasy","Literary","Art"] },
  { id:45, isbn:"9780060850524", title:"Brave New World", author:"Aldous Huxley", rating:4.3, genres:["Fiction","Sci-Fi","Classics"], contentRating:"Adult", pages:288, words:64000, language:"English", series:null, description:"Aldous Huxley's profoundly important classic of world literature depicts a darkly satiric vision of a utopian future gone wrong.", warnings:["Drug Use","Sexual Content","Death","Oppressive Government","Conditioning"], tropes:["Dystopia","Fish Out of Water","Rebellion"], tags:["Political","Philosophical","Futuristic","Social Commentary"] },
  { id:46, isbn:"9780544336261", title:"The Giver", author:"Lois Lowry", rating:4.4, genres:["YA","Sci-Fi","Fiction"], contentRating:"Teen", pages:208, words:43000, language:"English", series:{name:"The Giver Quartet",number:1,status:"Completed"}, description:"Jonas' world is perfect. Everything is under control and safe. There is no war or fear or pain. There are no choices. But when he is given his Assignment as the Receiver, Jonas begins to understand the dark secrets behind this fragile community.", warnings:["Death","Euthanasia","Mind Control","Oppressive Government"], tropes:["Chosen One","Dystopia","Coming of Age","Mentor Figure"], tags:["Philosophical","Futuristic","Coming of Age","Dark"] },
  { id:47, isbn:"9780312853235", title:"Ender's Game", author:"Orson Scott Card", rating:4.6, genres:["Sci-Fi","Fiction"], contentRating:"Teen", pages:324, words:100000, language:"English", series:{name:"Ender's Game",number:1,status:"Completed"}, description:"Andrew 'Ender' Wiggin thinks he is playing computer simulated war games at Battle School, but he is actually engaged in something far more desperate.", warnings:["Violence","Child Soldiers","Bullying","Death","Isolation","Manipulation"], tropes:["Chosen One","School Setting","Coming of Age","Mentor Figure"], tags:["Space","Action","Strategy","Coming of Age","War"] },
  { id:48, isbn:"9781451673319", title:"Fahrenheit 451", author:"Ray Bradbury", rating:4.4, genres:["Fiction","Sci-Fi","Classics"], contentRating:"Teen", pages:158, words:46000, language:"English", series:null, description:"Guy Montag is a fireman. In his world, firemen start fires rather than putting them out. His job is to destroy the most illegal of commodities: the printed book.", warnings:["Violence","Death","Oppressive Government","Suicide"], tropes:["Dystopia","Rebellion","Transformation"], tags:["Political","Philosophical","Futuristic","Dark"] },
  { id:49, isbn:"9780385737951", title:"The Maze Runner", author:"James Dashner", rating:4.2, genres:["YA","Sci-Fi","Fiction"], contentRating:"Teen", pages:375, words:101000, language:"English", series:{name:"The Maze Runner",number:1,status:"Completed"}, description:"When Thomas wakes up in the lift, the only thing he can remember is his name. He's surrounded by strangers — boys whose memories are also gone.", warnings:["Violence","Death","Child Death","Monsters","Amnesia"], tropes:["Chosen One","Survival","Found Family","Mystery"], tags:["Action","Adventure","Dark","Suspense","Futuristic"] },
  { id:50, isbn:"9780062310637", title:"Red Queen", author:"Victoria Aveyard", rating:4.1, genres:["Fantasy","YA","Fiction"], contentRating:"Teen", pages:383, words:101000, language:"English", series:{name:"Red Queen",number:1,status:"Completed"}, description:"Mare Barrow's world is divided by blood — those with common Red blood serve the Silver-blooded elite. But Mare discovers she possesses a deadly power of her own.", warnings:["Violence","Death","War","Betrayal","Oppressive Government"], tropes:["Chosen One","Dystopia","Strong Female Lead","Love Triangle","Political Intrigue"], tags:["Action","Adventure","Romance","Dark","Revolution"] },
  { id:51, isbn:"9780062797155", title:"The Tattooist of Auschwitz", author:"Heather Morris", rating:4.5, genres:["Fiction","Classics"], contentRating:"Adult", pages:262, words:67000, language:"English", series:null, description:"In 1942, Lale Sokolov arrived in Auschwitz-Birkenau. He was given the job of tattooing the prisoners marked for survival — and fell in love with one of them.", warnings:["Violence","Death","War","Starvation","Torture","Genocide"], tropes:["Forbidden Love","Survival","Star-Crossed Lovers"], tags:["Historical","Romance","War","Dark","Inspirational"] },
  { id:52, isbn:"9781501160837", title:"Anxious People", author:"Fredrik Backman", rating:4.2, genres:["Fiction"], contentRating:"All Ages", pages:341, words:88000, language:"English", series:null, description:"A failed bank robber locks himself in an apartment with a group of strangers during an open house. What follows is a hilariously twisted tale.", warnings:["Suicide Ideation","Mental Health","Grief"], tropes:["Found Family","Multiple POV","Misunderstanding","Plot Twist"], tags:["Humor","Contemporary","Mystery","Emotional","Family"] },
  { id:53, isbn:"9781250217318", title:"The House in the Cerulean Sea", author:"TJ Klune", rating:4.6, genres:["Fantasy","Fiction","Romance"], contentRating:"All Ages", pages:396, words:109000, language:"English", series:null, description:"Linus Baker is a caseworker at the Department in Charge Of Magical Youth. When he's sent to an orphanage on a remote island, his life changes forever.", warnings:["Discrimination","Prejudice"], tropes:["Found Family","Enemies to Lovers","Fish Out of Water","Slow Burn"], tags:["LGBTQ+","Humor","Fantasy","Romance","Heartwarming"] },
  { id:54, isbn:"9780062662569", title:"The Poppy War", author:"R.F. Kuang", rating:4.4, genres:["Fantasy","Fiction"], contentRating:"Adult", pages:527, words:160000, language:"English", series:{name:"The Poppy War",number:1,status:"Completed"}, description:"When Rin aced the Keju, she was convinced it was a dream. Fang Rin, a war orphan, has emerged from poverty to earn a spot at the most elite military school in Nikan.", warnings:["Graphic Violence","War","Genocide","Drug Use","Sexual Assault","Death","Torture","Racism"], tropes:["Chosen One","School Setting","Strong Female Lead","Coming of Age","Anti-Hero"], tags:["War","Dark","Magic","Historical","Political","Action"] },
  { id:55, isbn:"9781524763138", title:"Becoming", author:"Michelle Obama", rating:4.7, genres:["Non-Fiction","Memoir"], contentRating:"All Ages", pages:426, words:134000, language:"English", series:null, description:"In her memoir, former First Lady Michelle Obama invites readers into her world, chronicling her experiences from childhood through her time in the White House.", warnings:["Racism","Grief","Political Violence"], tropes:[], tags:["Memoir","Inspirational","Political","Family"] },
  { id:56, isbn:"9781538724736", title:"Verity", author:"Colleen Hoover", rating:4.3, genres:["Fiction","Thriller","Romance"], contentRating:"Adult", pages:314, words:80000, language:"English", series:null, description:"Lowen Ashleigh is a struggling writer who accepts the job offer of a lifetime — completing the remaining books in a bestselling series for an injured author, Verity Crawford.", warnings:["Graphic Sexual Content","Violence","Death","Child Death","Psychological Abuse","Manipulation"], tropes:["Unreliable Narrator","Plot Twist","Gothic","Obsession"], tags:["Mystery","Psychological","Dark","Suspense","Romance"] },
  { id:57, isbn:"9780312577223", title:"The Nightingale", author:"Kristin Hannah", rating:4.7, genres:["Fiction","Classics"], contentRating:"Adult", pages:440, words:134000, language:"English", series:null, description:"In the quiet village of Carriveau, Vianne Mauriac says goodbye to her husband, Antoine, as he heads for the Front. With France falling to the Nazis, two sisters must find strength.", warnings:["Violence","War","Death","Sexual Assault","Starvation","Torture"], tropes:["Strong Female Lead","Dual POV","Survival","Forbidden Love"], tags:["Historical","War","Romance","Family","Inspirational"] },
  { id:58, isbn:"9780525620785", title:"Mexican Gothic", author:"Silvia Moreno-Garcia", rating:3.9, genres:["Fiction","Thriller"], contentRating:"Adult", pages:301, words:80000, language:"English", series:null, description:"After receiving a frantic letter from her newlywed cousin, Noemí Taboada heads to a remote house in the Mexican countryside, where she discovers the family's dark secrets.", warnings:["Violence","Death","Racism","Poisoning","Body Horror","Sexual Content","Manipulation"], tropes:["Gothic","Strong Female Lead","Mystery","Gaslighting"], tags:["Mystery","Dark","Historical","Horror","Atmospheric"] },
  { id:59, isbn:"9781250224033", title:"The Atlas Six", author:"Olivie Blake", rating:3.9, genres:["Fantasy","Fiction"], contentRating:"Adult", pages:374, words:109000, language:"English", series:{name:"The Atlas",number:1,status:"Ongoing"}, description:"Six magicians are invited to join the Alexandrian Society — a secretive group that guards lost knowledge from ancient civilizations. Only five will be initiated.", warnings:["Violence","Death","Sexual Content","Manipulation","Strong Language"], tropes:["Morally Grey Characters","Multiple POV","School Setting","Enemies to Lovers"], tags:["Magic","Dark","Academic","Mystery","Romance"] },
  { id:60, isbn:"9781524798628", title:"Daisy Jones & The Six", author:"Taylor Jenkins Reid", rating:4.3, genres:["Fiction"], contentRating:"Adult", pages:355, words:88000, language:"English", series:null, description:"Everyone knows Daisy Jones & The Six, but nobody knows the reason behind their split at the height of their popularity — until now.", warnings:["Drug Use","Addiction","Sexual Content","Strong Language"], tropes:["Multiple POV","Unreliable Narrator","Slow Burn"], tags:["Music","Historical","Romance","Hollywood"] },
  { id:61, isbn:"9780593318171", title:"Klara and the Sun", author:"Kazuo Ishiguro", rating:4.1, genres:["Fiction","Sci-Fi"], contentRating:"All Ages", pages:303, words:75000, language:"English", series:null, description:"From the window of her store, Klara, an Artificial Friend with outstanding observational qualities, watches the behavior of those who come in to browse.", warnings:["Death","Isolation","Existential Threat"], tropes:["Fish Out of Water","Unreliable Narrator","Transformation"], tags:["Philosophical","Futuristic","Literary","Emotional","Science"] },
  { id:62, isbn:"9780374533557", title:"Thinking, Fast and Slow", author:"Daniel Kahneman", rating:4.5, genres:["Non-Fiction","Self-Help"], contentRating:"All Ages", pages:499, words:160000, language:"English", series:null, description:"A groundbreaking tour of the mind explaining the two systems that drive the way we think — fast, intuitive thinking, and slow, deliberate thinking.", warnings:[], tropes:[], tags:["Psychology","Science","Personal Development","Philosophy"] },
  { id:63, isbn:"9780385319959", title:"Outlander", author:"Diana Gabaldon", rating:4.5, genres:["Fiction","Romance","Fantasy"], contentRating:"Adult", pages:850, words:305000, language:"English", series:{name:"Outlander",number:1,status:"Ongoing"}, description:"Claire Randall is transported from 1945 to 1743 Scotland, where she is caught in the Jacobite risings and falls in love with a gallant young Scots warrior.", warnings:["Sexual Content","Violence","War","Death","Sexual Assault","Torture","Strong Language"], tropes:["Time Travel","Star-Crossed Lovers","Strong Female Lead","Slow Burn","Fish Out of Water"], tags:["Romance","Historical","Adventure","War","Epic"] },
  { id:64, isbn:"9781984806758", title:"People We Meet on Vacation", author:"Emily Henry", rating:4.2, genres:["Fiction","Romance"], contentRating:"Adult", pages:364, words:95000, language:"English", series:null, description:"Alex and Poppy have nothing in common. She's outgoing, he's introverted. But every summer for the past decade, they've taken a vacation together.", warnings:["Sexual Content","Strong Language","Grief"], tropes:["Friends to Lovers","Dual POV","Will They/Won't They","Slow Burn"], tags:["Romance","Humor","Contemporary","Summer","Travel"] },
  { id:65, isbn:"9781595148032", title:"An Ember in the Ashes", author:"Sabaa Tahir", rating:4.4, genres:["Fantasy","YA","Fiction"], contentRating:"Teen", pages:446, words:125000, language:"English", series:{name:"An Ember in the Ashes",number:1,status:"Completed"}, description:"Under the Martial Empire, defiance is met with death. When Laia's brother is arrested for treason, she goes undercover as a slave at the Empire's military academy.", warnings:["Violence","Death","Slavery","Torture","Sexual Assault","War"], tropes:["Enemies to Lovers","Dual POV","Strong Female Lead","Rebellion"], tags:["Adventure","Action","Romance","Dark","Revolution"] },
  { id:66, isbn:"9781635570304", title:"The Priory of the Orange Tree", author:"Samantha Shannon", rating:4.2, genres:["Fantasy","Fiction"], contentRating:"Adult", pages:848, words:250000, language:"English", series:null, description:"A world divided. A queendom without an heir. An ancient enemy awakens. The House of Berethnet has ruled Inys for a thousand years, but now the kingdom faces its greatest threat.", warnings:["Violence","Death","War","Sexual Content"], tropes:["Strong Female Lead","Multiple POV","Prophecy","Slow Burn","Fae"], tags:["Epic","Adventure","LGBTQ+","Dragons","Political","Feminist"] },
  { id:67, isbn:"9780385353304", title:"Station Eleven", author:"Emily St. John Mandel", rating:4.2, genres:["Fiction","Sci-Fi"], contentRating:"Adult", pages:333, words:82000, language:"English", series:null, description:"An audacious, darkly glittering novel about art, fame, and ambition set in a world connected by one extraordinary book, spanning decades before and after a devastating pandemic.", warnings:["Death","Pandemic","Violence","Grief"], tropes:["Multiple POV","Multi-Generational","Survival"], tags:["Literary","Futuristic","Art","Philosophical","Dark"] },
  { id:68, isbn:"9780593336823", title:"The Love Hypothesis", author:"Ali Hazelwood", rating:4.2, genres:["Fiction","Romance"], contentRating:"Adult", pages:384, words:100000, language:"English", series:null, description:"When third-year Ph.D. candidate Olive Smith fabricates a relationship with a young professor to convince her best friend that she's moved on, she never expects it to become real.", warnings:["Sexual Content","Sexual Assault","Strong Language"], tropes:["Fake Dating","Enemies to Lovers","Forced Proximity","Slow Burn"], tags:["Romance","Humor","Contemporary","Academic","STEM"] },
  { id:69, isbn:"9781451626650", title:"Catch-22", author:"Joseph Heller", rating:4.3, genres:["Fiction","Classics"], contentRating:"Adult", pages:453, words:175000, language:"English", series:null, description:"Set in Italy during World War II, this is the story of Captain John Yossarian, a bombardier who is furious because thousands of people he has never met are trying to kill him.", warnings:["Violence","Death","War","Sexual Content","Strong Language"], tropes:["Anti-Hero","Rebellion","Satire"], tags:["War","Humor","Political","Literary","Dark"] },
  { id:70, isbn:"9781476738024", title:"A Man Called Ove", author:"Fredrik Backman", rating:4.5, genres:["Fiction"], contentRating:"All Ages", pages:337, words:85000, language:"English", series:null, description:"At first sight, Ove is almost certainly the grumpiest man you will ever meet. But behind the bitter exterior there is a story and a sadness.", warnings:["Suicide Ideation","Death","Grief","Bullying"], tropes:["Found Family","Unlikely Friendship","Transformation"], tags:["Humor","Emotional","Contemporary","Heartwarming","Family"] },
  { id:71, isbn:"9781635574043", title:"Crescent City: House of Earth and Blood", author:"Sarah J. Maas", rating:4.4, genres:["Fantasy","Romance","Fiction"], contentRating:"Adult", pages:803, words:240000, language:"English", series:{name:"Crescent City",number:1,status:"Ongoing"}, description:"Bryce Quinlan had the perfect life — until a demon murdered her closest friends. When the accused is jailed, Bryce sets out to avenge their deaths.", warnings:["Graphic Violence","Death","Graphic Sexual Content","Drug Use","Grief","Strong Language","PTSD"], tropes:["Enemies to Lovers","Found Family","Strong Female Lead","Mystery","Slow Burn"], tags:["Romance","Adventure","Action","Dark","Urban Fantasy","Mystery"] },
  { id:72, isbn:"9780140280197", title:"The 48 Laws of Power", author:"Robert Greene", rating:4.4, genres:["Non-Fiction","Self-Help"], contentRating:"Adult", pages:452, words:140000, language:"English", series:null, description:"Amoral, cunning, ruthless, and instructive, this multi-million-copy bestseller draws from the philosophies of Machiavelli, Sun Tzu, and Carl Von Clausewitz.", warnings:["Manipulation","Violence"], tropes:[], tags:["Psychology","Political","History","Personal Development"] },
  { id:73, isbn:"9780767905923", title:"Tuesdays with Morrie", author:"Mitch Albom", rating:4.6, genres:["Non-Fiction","Memoir"], contentRating:"All Ages", pages:192, words:40000, language:"English", series:null, description:"Maybe it was a grandparent, a teacher, or a colleague. Someone older, patient, and wise, who understood you when you were young and helped you see the world as a more profound place.", warnings:["Death","Terminal Illness","Grief"], tropes:["Mentor Figure"], tags:["Memoir","Inspirational","Philosophy","Emotional"] },
  { id:74, isbn:"9781101904220", title:"Dark Matter", author:"Blake Crouch", rating:4.4, genres:["Sci-Fi","Fiction","Thriller"], contentRating:"Adult", pages:342, words:85000, language:"English", series:null, description:"Jason Dessen is walking home through the streets of Chicago when he's abducted. He wakes up strapped to a gurney in a lab, surrounded by strangers who call him 'hero.'", warnings:["Violence","Death","Kidnapping","Drug Use","Existential Threat"], tropes:["What If","Multiple Realities","Love Story","Plot Twist"], tags:["Suspense","Science","Romance","Action","Psychological"] },
  { id:75, isbn:"9781250170972", title:"Children of Blood and Bone", author:"Tomi Adeyemi", rating:4.3, genres:["Fantasy","YA","Fiction"], contentRating:"Teen", pages:525, words:140000, language:"English", series:{name:"Legacy of Orïsha",number:1,status:"Ongoing"}, description:"Zélie Adebola remembers when the soil of Orïsha hummed with magic. But everything changed the night magic disappeared. Under King Saran's orders, maji were targeted and killed.", warnings:["Violence","Death","Oppressive Government","Torture","Racism","Slavery"], tropes:["Chosen One","Strong Female Lead","Enemies to Lovers","Quest","Coming of Age"], tags:["Adventure","Action","Romance","Magic","Revolution","African-Inspired"] },
  { id:76, isbn:"9788423342662", title:"Nada", author:"Carmen Laforet", rating:4.1, genres:["Fiction","Classics"], contentRating:"Adult", pages:292, words:75000, language:"Spanish", series:null, description:"Andrea llega a Barcelona para estudiar en la universidad. Se instala en casa de su abuela, donde descubre una familia destruida por la Guerra Civil.", warnings:["Abuse","Violence","Poverty","Depression","Dysfunctional Family"], tropes:["Coming of Age","Outcast","Transformation"], tags:["Literary","Historical","Coming of Age","Dark","Family"] },
  { id:77, isbn:"9781400079278", title:"Kafka on the Shore", author:"Haruki Murakami", rating:4.3, genres:["Fiction","Fantasy"], contentRating:"Adult", pages:467, words:130000, language:"Japanese", series:null, description:"Kafka Tamura runs away from home at fifteen, while an aging simpleton named Nakata is drawn to Kafka by fate. As their odyssey unfolds, reality and dreams merge.", warnings:["Violence","Sexual Content","Death","Incest Themes","Animal Death"], tropes:["Coming of Age","Dual POV","Magical Realism","Quest"], tags:["Philosophical","Surreal","Literary","Adventure","Magical"] },
  { id:78, isbn:"9780375714573", title:"Persepolis", author:"Marjane Satrapi", rating:4.4, genres:["Non-Fiction","Memoir"], contentRating:"Teen", pages:160, words:25000, language:"French", series:null, description:"A graphic memoir recounting a girl's coming of age against the backdrop of the Iranian Revolution. Marjane sees the changes to her country and her family through innocent eyes.", warnings:["Violence","War","Death","Oppressive Government","Torture"], tropes:["Coming of Age","Rebellion"], tags:["Memoir","Political","Historical","Coming of Age","War"] },
  { id:79, isbn:"9780307389732", title:"El amor en los tiempos del cólera", author:"Gabriel García Márquez", rating:4.4, genres:["Fiction","Romance","Classics"], contentRating:"Adult", pages:368, words:105000, language:"Spanish", series:null, description:"En la época del cólera, Florentino Ariza espera más de cincuenta años para declarar su amor eterno a Fermina Daza, una historia de pasión y paciencia.", warnings:["Sexual Content","Death","Infidelity","Suicide"], tropes:["Unrequited Love","Slow Burn","Star-Crossed Lovers","Multi-Generational"], tags:["Romance","Historical","Literary","Emotional","Magical"] },
  { id:80, isbn:"9780375704024", title:"Norwegian Wood", author:"Haruki Murakami", rating:4.2, genres:["Fiction","Romance"], contentRating:"Adult", pages:296, words:85000, language:"Japanese", series:null, description:"Toru Watanabe, a quiet and preternaturally serious young college student in Tokyo, is devoted to Naoko, a beautiful and introspective young woman haunted by a terrible loss.", warnings:["Suicide","Death","Sexual Content","Depression","Mental Health","Self-Harm"], tropes:["Love Triangle","Coming of Age","Tragic Ending"], tags:["Romance","Literary","Coming of Age","Emotional","Contemporary"] },
  { id:81, isbn:"9781501173219", title:"All the Light We Cannot See", author:"Anthony Doerr", rating:4.6, genres:["Fiction","Classics"], contentRating:"Teen", pages:531, words:150000, language:"English", series:null, description:"Marie-Laure lives in Paris with her father. When she is six, she goes blind. When she is twelve, the Nazis occupy Paris and they flee to the walled citadel of Saint-Malo.", warnings:["Violence","War","Death","Bombing","Blindness"], tropes:["Dual POV","Coming of Age","Star-Crossed Lovers","Survival"], tags:["Historical","War","Inspirational","Literary","Radio"] },
  { id:82, isbn:"9781982115807", title:"Shōgun", author:"James Clavell", rating:4.7, genres:["Fiction","Classics"], contentRating:"Adult", pages:1152, words:400000, language:"English", series:null, description:"An English navigator shipwrecked in 1600 Japan is drawn into the political and cultural machinations of feudal lords vying for the title of Shōgun.", warnings:["Violence","Death","Sexual Content","War","Torture","Suicide","Cultural Shock"], tropes:["Fish Out of Water","Political Intrigue","Slow Burn","Forbidden Love"], tags:["Historical","Adventure","Political","Epic","War","Romance"] },
  { id:83, isbn:"9781455563920", title:"Pachinko", author:"Min Jin Lee", rating:4.5, genres:["Fiction"], contentRating:"Adult", pages:490, words:140000, language:"English", series:null, description:"Yeongdo, Korea 1911. In a small fishing village, a club-footed, cleft-lipped man marries a fifteen-year-old girl. The novel follows four generations of a Korean family who migrate to Japan.", warnings:["Racism","Death","Sexual Content","Poverty","War","Discrimination"], tropes:["Multi-Generational","Strong Female Lead","Survival","Rags to Riches"], tags:["Historical","Family","Literary","Immigration","Emotional"] },
  { id:84, isbn:"9780375726217", title:"Der Vorleser", author:"Bernhard Schlink", rating:4.1, genres:["Fiction","Classics"], contentRating:"Adult", pages:218, words:55000, language:"German", series:null, description:"Ein fünfzehnjähriger Junge beginnt eine Liebesaffäre mit einer älteren Frau. Jahre später entdeckt er als Jurastudent, dass sie wegen Kriegsverbrechen angeklagt wird.", warnings:["Sexual Content","War Crimes","Death","Guilt","Age Gap"], tropes:["Coming of Age","Forbidden Love","Tragic Ending","Unreliable Narrator"], tags:["Historical","Romance","Dark","Literary","War"] },
  { id:85, isbn:"9780679720201", title:"L'Étranger", author:"Albert Camus", rating:4.3, genres:["Fiction","Classics"], contentRating:"Adult", pages:123, words:36000, language:"French", series:null, description:"Meursault, un employé de bureau à Alger, apprend la mort de sa mère et réagit avec une indifférence choquante, menant à un destin tragique.", warnings:["Violence","Death","Existential Themes","Gun Violence"], tropes:["Anti-Hero","Unreliable Narrator","Tragedy"], tags:["Philosophical","Literary","Dark","Existential"] },
  { id:86, isbn:"9780544176560", title:"Il nome della rosa", author:"Umberto Eco", rating:4.4, genres:["Fiction","Mystery","Classics"], contentRating:"Adult", pages:536, words:180000, language:"Italian", series:null, description:"Nel 1327, il frate francescano Guglielmo da Baskerville arriva in un'abbazia benedettina per indagare su una serie di misteriose morti.", warnings:["Violence","Death","Religious Themes","Poisoning","Torture"], tropes:["Mystery","Mentor Figure","Political Intrigue"], tags:["Historical","Mystery","Philosophy","Religious","Dark"] },
  { id:87, isbn:"9780140187311", title:"Momo", author:"Michael Ende", rating:4.5, genres:["Fiction","Fantasy"], contentRating:"All Ages", pages:236, words:65000, language:"German", series:null, description:"Momo ist ein kleines Mädchen mit einer besonderen Gabe: Sie kann zuhören. Als die grauen Herren beginnen, den Menschen die Zeit zu stehlen, muss Momo die Zeit retten.", warnings:[], tropes:["Chosen One","Quest","Coming of Age"], tags:["Fantasy","Philosophical","Adventure","Heartwarming"] },
  { id:88, isbn:"9780895267153", title:"Kokoro", author:"Natsume Sōseki", rating:4.3, genres:["Fiction","Classics"], contentRating:"Adult", pages:248, words:70000, language:"Japanese", series:null, description:"A young man forms a bond with an older man he calls 'Sensei,' gradually uncovering the dark secrets and guilt that have shaped his mentor's reclusive life.", warnings:["Suicide","Death","Guilt","Betrayal","Depression"], tropes:["Mentor Figure","Unreliable Narrator","Tragedy"], tags:["Literary","Philosophical","Emotional","Historical","Dark"] },
  { id:89, isbn:"9780060934347", title:"Don Quijote de la Mancha", author:"Miguel de Cervantes", rating:4.4, genres:["Fiction","Classics"], contentRating:"All Ages", pages:982, words:430000, language:"Spanish", series:null, description:"Las aventuras del ingenioso hidalgo que enloquece leyendo libros de caballerías y sale a recorrer el mundo junto a su fiel escudero Sancho Panza.", warnings:["Violence","Delusion"], tropes:["Quest","Unlikely Hero","Mentor Figure","Satire"], tags:["Adventure","Humor","Philosophical","Epic","Literary"] },
  { id:90, isbn:"9780062961372", title:"Almond", author:"Won-pyung Sohn", rating:4.3, genres:["Fiction","YA"], contentRating:"Teen", pages:272, words:65000, language:"Korean", series:null, description:"Born with a brain condition called alexithymia, Yunjae cannot feel emotions like fear or anger. After a devastating loss, an unlikely friendship challenges everything he knows.", warnings:["Violence","Death","Grief","Disability"], tropes:["Unlikely Friendship","Coming of Age","Transformation"], tags:["Contemporary","Emotional","Coming of Age","Friendship","Literary"] },
  { id:91, isbn:"9780802127747", title:"Convenience Store Woman", author:"Sayaka Murata", rating:3.9, genres:["Fiction"], contentRating:"All Ages", pages:163, words:40000, language:"Japanese", series:null, description:"Keiko Furukura has worked at a convenience store for eighteen years, finding peace in its routines. But pressure from society pushes her toward 'normalcy.'", warnings:["Social Pressure","Mental Health"], tropes:["Outcast","Anti-Hero","Transformation"], tags:["Contemporary","Literary","Humor","Social Commentary","Feminist"] },
  { id:92, isbn:"9780062502179", title:"O Alquimista", author:"Paulo Coelho", rating:4.3, genres:["Fiction","Fantasy"], contentRating:"All Ages", pages:197, words:39000, language:"Portuguese", series:null, description:"A história de Santiago, um jovem pastor andaluz que parte em busca de um tesouro escondido nas Pirâmides do Egito, descobrindo o verdadeiro sentido da vida.", warnings:[], tropes:["Quest","Coming of Age","Mentor Figure"], tags:["Inspirational","Adventure","Philosophy","Spiritual"] },
  { id:93, isbn:"9780486415871", title:"Crime and Punishment", author:"Fyodor Dostoevsky", rating:4.5, genres:["Fiction","Classics"], contentRating:"Adult", pages:671, words:211000, language:"English", series:null, description:"Raskolnikov, a destitute student living in St. Petersburg, conceives and executes a murder — and then must deal with the psychological and moral consequences.", warnings:["Violence","Death","Murder","Poverty","Mental Health","Alcoholism"], tropes:["Anti-Hero","Redemption","Psychological Descent","Tragedy"], tags:["Philosophical","Dark","Psychological","Literary","Crime"] },
  { id:94, isbn:"9780451419439", title:"Les Misérables", author:"Victor Hugo", rating:4.6, genres:["Fiction","Classics"], contentRating:"Adult", pages:1463, words:531000, language:"French", series:null, description:"Jean Valjean, condamné au bagne pour avoir volé du pain, tente de reconstruire sa vie après sa libération, poursuivi par l'inspecteur Javert.", warnings:["Violence","Death","Poverty","War","Child Abuse","Suicide","Injustice"], tropes:["Redemption","Rags to Riches","Political Intrigue","Star-Crossed Lovers"], tags:["Historical","Political","Epic","Dark","Inspirational","Revolution"] },
  { id:95, isbn:"9781594631931", title:"The Kite Runner", author:"Khaled Hosseini", rating:4.6, genres:["Fiction"], contentRating:"Adult", pages:371, words:107000, language:"English", series:null, description:"The story of Amir, a young boy from the Wazir Akbar Khan district of Kabul, whose closest friend is Hassan, the son of his father's servant.", warnings:["Violence","Sexual Assault","Child Abuse","War","Death","Racism","Bullying"], tropes:["Coming of Age","Redemption","Guilt","Found Family"], tags:["Historical","War","Emotional","Family","Literary"] },
  { id:96, isbn:"9780141439570", title:"The Picture of Dorian Gray", author:"Oscar Wilde", rating:4.4, genres:["Fiction","Classics"], contentRating:"Adult", pages:254, words:78000, language:"English", series:null, description:"A young man sells his soul for eternal youth and beauty. A corrupt bargain leads to the gradual destruction of everything Dorian Gray holds dear.", warnings:["Violence","Death","Murder","Drug Use","Manipulation","Suicide"], tropes:["Deal with the Devil","Tragedy","Anti-Hero","Obsession"], tags:["Gothic","Dark","Philosophical","Literary","Art"] },
  { id:97, isbn:"9780141439471", title:"Frankenstein", author:"Mary Shelley", rating:4.3, genres:["Fiction","Sci-Fi","Classics"], contentRating:"Teen", pages:280, words:75000, language:"English", series:null, description:"Victor Frankenstein, a Swiss scientist, creates a sapient creature in an unorthodox experiment, only to be horrified by what he has made.", warnings:["Violence","Death","Murder","Isolation","Grief","Abandonment"], tropes:["Man vs Nature","Tragedy","Obsession","Creator and Creation"], tags:["Gothic","Science","Dark","Philosophical","Horror"] },
  { id:98, isbn:"9780141439846", title:"Dracula", author:"Bram Stoker", rating:4.2, genres:["Fiction","Classics"], contentRating:"Adult", pages:418, words:161000, language:"English", series:null, description:"When Jonathan Harker visits Transylvania to help Count Dracula with the purchase of a London house, he makes horrifying discoveries about his client.", warnings:["Violence","Death","Blood","Mind Control","Sexual Content"], tropes:["Gothic","Forbidden Love","Obsession","Survival"], tags:["Horror","Dark","Mystery","Adventure","Gothic"] },
  { id:99, isbn:"9780141441146", title:"Jane Eyre", author:"Charlotte Brontë", rating:4.5, genres:["Fiction","Romance","Classics"], contentRating:"Teen", pages:507, words:188000, language:"English", series:null, description:"Orphaned as a child, Jane Eyre endures an unhappy childhood but grows into a strong and independent woman. As governess at Thornfield Hall, she falls in love with the mysterious Mr. Rochester.", warnings:["Child Abuse","Death","Fire","Grief","Manipulation","Mental Health"], tropes:["Enemies to Lovers","Strong Female Lead","Gothic","Class Differences","Forbidden Love"], tags:["Romance","Gothic","Feminist","Literary","Historical"] },
  { id:100, isbn:"9780141439556", title:"Wuthering Heights", author:"Emily Brontë", rating:4.2, genres:["Fiction","Romance","Classics"], contentRating:"Adult", pages:342, words:107000, language:"English", series:null, description:"At the centre of this novel is the passionate and doomed love between Catherine Earnshaw and Heathcliff, set among the wild moors of northern England.", warnings:["Violence","Death","Abuse","Child Abuse","Racism","Alcoholism","Manipulation","Grief"], tropes:["Star-Crossed Lovers","Tragic Ending","Obsession","Multi-Generational","Revenge"], tags:["Romance","Gothic","Dark","Literary","Nature"] },
  { id:101, isbn:"9780316769488", title:"The Catcher in the Rye", author:"J.D. Salinger", rating:4.0, genres:["Fiction","Classics"], contentRating:"Teen", pages:234, words:73000, language:"English", series:null, description:"Holden Caulfield, a teenager alienated from society, narrates his experiences in New York City after being expelled from prep school.", warnings:["Strong Language","Depression","Alcoholism","Sexual Content","Mental Health"], tropes:["Coming of Age","Unreliable Narrator","Anti-Hero","Outcast"], tags:["Literary","Coming of Age","Contemporary","Philosophical"] },
  { id:102, isbn:"9781400033416", title:"Beloved", author:"Toni Morrison", rating:4.4, genres:["Fiction","Classics"], contentRating:"Adult", pages:324, words:100000, language:"English", series:null, description:"Sethe, a former slave, has paid the price for escaping. Her Ohio home is haunted by the ghost of her baby, who died nameless.", warnings:["Slavery","Violence","Death","Sexual Assault","Child Death","Infanticide","PTSD","Racism"], tropes:["Gothic","Magical Realism","Strong Female Lead","Tragedy"], tags:["Historical","Dark","Literary","Supernatural","Family"] },
  { id:103, isbn:"9780156028356", title:"The Color Purple", author:"Alice Walker", rating:4.5, genres:["Fiction","Classics"], contentRating:"Adult", pages:295, words:67000, language:"English", series:null, description:"Celie is a poor black woman whose letters tell the story of 20 years of her life, beginning at age fourteen when she is being abused and controlled.", warnings:["Sexual Abuse","Racism","Domestic Violence","Child Abuse","Death","Homophobia"], tropes:["Strong Female Lead","Transformation","Found Family","Forbidden Love"], tags:["Historical","Feminist","LGBTQ+","Literary","Family","Inspirational"] },
  { id:104, isbn:"9780385333481", title:"Slaughterhouse-Five", author:"Kurt Vonnegut", rating:4.3, genres:["Fiction","Sci-Fi","Classics"], contentRating:"Adult", pages:275, words:50000, language:"English", series:null, description:"Billy Pilgrim has come unstuck in time, traveling between his life as a World War II soldier, his post-war existence, and his time on the alien planet Tralfamadore.", warnings:["Violence","War","Death","PTSD","Bombing","Strong Language"], tropes:["Unreliable Narrator","Time Travel","Anti-Hero","Satire"], tags:["War","Philosophical","Humor","Surreal","Futuristic"] },
  { id:105, isbn:"9780307387899", title:"The Road", author:"Cormac McCarthy", rating:4.3, genres:["Fiction","Sci-Fi"], contentRating:"Adult", pages:287, words:58000, language:"English", series:null, description:"A father and his young son walk alone through burned America, heading through the ravaged landscape to the coast.", warnings:["Violence","Death","Starvation","Cannibalism","Suicide","Despair"], tropes:["Survival","Man vs Nature","Coming of Age","Tragedy"], tags:["Dark","Literary","Futuristic","Nature","Emotional"] },
  { id:106, isbn:"9780062073488", title:"And Then There Were None", author:"Agatha Christie", rating:4.6, genres:["Fiction","Mystery","Classics"], contentRating:"Teen", pages:272, words:65000, language:"English", series:null, description:"Ten strangers are lured to an isolated island mansion off the Devon coast by a mysterious host. One by one, the guests share a dark secret — and one by one, they die.", warnings:["Death","Murder","Violence","Guilt","Suicide"], tropes:["Mystery","Plot Twist","Unreliable Narrator","Survival"], tags:["Mystery","Suspense","Dark","Psychological","Atmospheric"] },
  { id:107, isbn:"9780062073501", title:"Murder on the Orient Express", author:"Agatha Christie", rating:4.4, genres:["Fiction","Mystery","Classics"], contentRating:"All Ages", pages:256, words:60000, language:"English", series:{name:"Hercule Poirot",number:10,status:"Completed"}, description:"Just after midnight, a snowdrift stops the Orient Express. By morning, the American millionaire Samuel Edward Ratchett lies dead in his compartment — stabbed.", warnings:["Murder","Death","Violence"], tropes:["Mystery","Plot Twist","Multiple POV"], tags:["Mystery","Suspense","Historical","Travel"] },
  { id:108, isbn:"9780140449266", title:"The Count of Monte Cristo", author:"Alexandre Dumas", rating:4.7, genres:["Fiction","Classics"], contentRating:"Teen", pages:1276, words:464000, language:"English", series:null, description:"Falsely accused of treason, Edmond Dantès is imprisoned in the Château d'If. After a daring escape and discovering a fortune, he reinvents himself as the mysterious Count of Monte Cristo.", warnings:["Violence","Death","Imprisonment","Poisoning","Betrayal","Revenge"], tropes:["Revenge","Rags to Riches","Transformation","Political Intrigue"], tags:["Adventure","Historical","Political","Dark","Epic","Romance"] },
  { id:109, isbn:"9781400031702", title:"The Secret History", author:"Donna Tartt", rating:4.3, genres:["Fiction","Thriller"], contentRating:"Adult", pages:559, words:167000, language:"English", series:null, description:"Under the influence of their charismatic classics professor, a group of clever students at a Vermont college discover a way of thinking and living that is beautiful but leads to murder.", warnings:["Murder","Death","Drug Use","Alcoholism","Incest","Manipulation","Mental Health"], tropes:["Unreliable Narrator","School Setting","Dark Academic","Obsession","Tragedy"], tags:["Dark","Academic","Mystery","Psychological","Literary"] },
  { id:110, isbn:"9780679731726", title:"The Remains of the Day", author:"Kazuo Ishiguro", rating:4.4, genres:["Fiction","Classics"], contentRating:"All Ages", pages:245, words:70000, language:"English", series:null, description:"A masterful portrait of the perfect English butler and his world in the great house of an English lord as the Second World War looms.", warnings:["Grief","Regret","War"], tropes:["Unreliable Narrator","Slow Burn","Transformation"], tags:["Historical","Literary","Emotional","Philosophical"] },
  { id:111, isbn:"9780143110439", title:"A Gentleman in Moscow", author:"Amor Towles", rating:4.6, genres:["Fiction"], contentRating:"All Ages", pages:462, words:136000, language:"English", series:null, description:"Count Alexander Rostov is sentenced to house arrest in a luxury hotel across the street from the Kremlin, where he will live out the rest of his life.", warnings:["Violence","Death","Imprisonment"], tropes:["Found Family","Fish Out of Water","Slow Burn","Mentor Figure"], tags:["Historical","Humor","Literary","Inspirational","Political"] },
  { id:112, isbn:"9781524759780", title:"Recursion", author:"Blake Crouch", rating:4.3, genres:["Sci-Fi","Fiction","Thriller"], contentRating:"Adult", pages:320, words:82000, language:"English", series:null, description:"Memory makes reality. A mysterious affliction is sweeping the nation — False Memory Syndrome. A detective and a neuroscientist race to stop the collapse of reality itself.", warnings:["Violence","Death","Suicide","Memory Loss","Existential Threat"], tropes:["Multiple Realities","Plot Twist","Love Story","Science Hero"], tags:["Suspense","Science","Romance","Psychological","Action"] },
  { id:113, isbn:"9780307949486", title:"The Girl with the Dragon Tattoo", author:"Stieg Larsson", rating:4.3, genres:["Fiction","Thriller","Mystery"], contentRating:"Adult", pages:465, words:152000, language:"English", series:{name:"Millennium",number:1,status:"Completed"}, description:"Harriet Vanger, a scion of Sweden's wealthiest family, disappeared forty years ago. Now, her aged uncle hires journalist Mikael Blomkvist to investigate.", warnings:["Violence","Sexual Assault","Rape","Murder","Torture","Abuse"], tropes:["Strong Female Lead","Mystery","Revenge","Unlikely Friendship"], tags:["Mystery","Dark","Suspense","Action","Crime"] },
  { id:114, isbn:"9781400078776", title:"Never Let Me Go", author:"Kazuo Ishiguro", rating:4.1, genres:["Fiction","Sci-Fi"], contentRating:"Adult", pages:288, words:78000, language:"English", series:null, description:"Kathy, Tommy, and Ruth grow up at Hailsham, a secluded English boarding school. Gradually they discover a chilling truth about what their seemingly idyllic childhood has been preparing them for.", warnings:["Death","Existential Threat","Grief","Organ Harvesting"], tropes:["Coming of Age","Love Triangle","Tragic Ending","Unreliable Narrator"], tags:["Literary","Philosophical","Dark","Emotional","Futuristic"] },
  { id:115, isbn:"9780385534635", title:"The Night Circus", author:"Erin Morgenstern", rating:4.4, genres:["Fantasy","Fiction","Romance"], contentRating:"All Ages", pages:387, words:104000, language:"English", series:null, description:"The circus arrives without warning. No announcements precede it. Within these nocturnal black-and-white striped tents is an utterly unique experience.", warnings:["Death","Manipulation"], tropes:["Star-Crossed Lovers","Slow Burn","Dual POV","Competition"], tags:["Romance","Fantasy","Atmospheric","Magic","Art"] },
  { id:116, isbn:"9781526622426", title:"Piranesi", author:"Susanna Clarke", rating:4.2, genres:["Fantasy","Fiction"], contentRating:"All Ages", pages:272, words:65000, language:"English", series:null, description:"Piranesi's house is no ordinary building: its rooms are infinite, its corridors endless. The ocean is strange, flooding the halls with crashing tides. Piranesi loves it here.", warnings:["Manipulation","Isolation","Memory Loss","Death"], tropes:["Unreliable Narrator","Mystery","Fish Out of Water"], tags:["Fantasy","Philosophical","Surreal","Literary","Atmospheric"] },
  { id:117, isbn:"9780143034902", title:"The Shadow of the Wind", author:"Carlos Ruiz Zafón", rating:4.5, genres:["Fiction","Mystery"], contentRating:"Teen", pages:487, words:145000, language:"Spanish", series:{name:"The Cemetery of Forgotten Books",number:1,status:"Completed"}, description:"Daniel Sempere finds a mysterious book in the Cemetery of Forgotten Books. As he investigates its author, he is drawn into Barcelona's dark past.", warnings:["Violence","Death","War","Fire","Manipulation","Child Abuse"], tropes:["Mystery","Coming of Age","Gothic","Dual POV","Multi-Generational"], tags:["Mystery","Historical","Gothic","Romance","Literary","Atmospheric"] },
  { id:118, isbn:"9780553208849", title:"Siddhartha", author:"Hermann Hesse", rating:4.4, genres:["Fiction","Classics"], contentRating:"All Ages", pages:152, words:40000, language:"German", series:null, description:"Die Geschichte eines jungen Mannes im alten Indien, der auf der Suche nach dem wahren Sinn des Lebens verschiedene Lebenswege beschreitet.", warnings:[], tropes:["Quest","Coming of Age","Mentor Figure","Transformation"], tags:["Philosophical","Spiritual","Literary","Inspirational","Historical"] },
  { id:119, isbn:"9781635617337", title:"Kim Ji-young, Born 1982", author:"Cho Nam-Joo", rating:4.0, genres:["Fiction"], contentRating:"Adult", pages:163, words:40000, language:"Korean", series:null, description:"Kim Ji-young is a thirty-three-year-old woman who suddenly begins inhabiting the voices of other women. Her story is every woman's story.", warnings:["Sexism","Depression","Discrimination","Mental Health","Harassment"], tropes:["Strong Female Lead","Transformation","Social Critique"], tags:["Feminist","Contemporary","Social Commentary","Literary","Emotional"] },
  { id:120, isbn:"9780679775430", title:"The Wind-Up Bird Chronicle", author:"Haruki Murakami", rating:4.3, genres:["Fiction","Fantasy"], contentRating:"Adult", pages:607, words:175000, language:"Japanese", series:null, description:"Toru Okada's cat disappears, then his wife disappears. A bizarre journey begins as reality warps and the past intervenes in the present.", warnings:["Violence","Torture","Sexual Content","Death","War","Psychological Abuse"], tropes:["Quest","Magical Realism","Obsession","Multiple POV"], tags:["Surreal","Philosophical","Dark","Literary","Psychological","Mystery"] },
  { id:121, isbn:"9781250316776", title:"Red, White & Royal Blue", author:"Casey McQuiston", rating:4.2, genres:["Fiction","Romance"], contentRating:"Adult", pages:421, words:120000, language:"English", series:null, description:"When the First Son of the United States and the Prince of Wales have an altercation at a royal wedding, their staged friendship evolves into something more.", warnings:["Sexual Content","Homophobia","Strong Language","Political Pressure"], tropes:["Enemies to Lovers","Forced Proximity","Forbidden Love","Slow Burn"], tags:["Romance","LGBTQ+","Humor","Political","Contemporary"] },
  { id:122, isbn:"9780525536291", title:"The Vanishing Half", author:"Brit Bennett", rating:4.3, genres:["Fiction"], contentRating:"Adult", pages:343, words:94000, language:"English", series:null, description:"The Vignes twin sisters will always be identical. But after growing up together in a small, southern Black community and running away at age sixteen, it's not just the distance between them that widens.", warnings:["Racism","Domestic Violence","Identity Crisis","Death"], tropes:["Dual POV","Multi-Generational","Forbidden Love","Transformation"], tags:["Historical","Literary","Family","Social Commentary","Race"] },
  { id:123, isbn:"9780063021426", title:"Babel", author:"R.F. Kuang", rating:4.4, genres:["Fantasy","Fiction"], contentRating:"Adult", pages:545, words:165000, language:"English", series:null, description:"Tradecraft is the study of translation, and at the Royal Institute of Translation at Oxford, the magic of silver-working — and the power of empire — are one and the same.", warnings:["Violence","Death","Racism","Colonialism","War","Betrayal"], tropes:["School Setting","Coming of Age","Found Family","Rebellion","Anti-Hero"], tags:["Academic","Dark","Historical","Political","Revolution","Magic"] },
  { id:124, isbn:"9780593321201", title:"Tomorrow, and Tomorrow, and Tomorrow", author:"Gabrielle Zevin", rating:4.4, genres:["Fiction"], contentRating:"Adult", pages:416, words:115000, language:"English", series:null, description:"Two friends — often in love, but never lovers — come together as creative partners in the world of video game design.", warnings:["Violence","Death","Grief","Disability","Gun Violence","Strong Language"], tropes:["Friends to Lovers","Will They/Won't They","Dual POV","Slow Burn","Tragedy"], tags:["Contemporary","Art","Friendship","Gaming","Literary","Emotional"] },
  { id:125, isbn:"9780374528379", title:"The Brothers Karamazov", author:"Fyodor Dostoevsky", rating:4.6, genres:["Fiction","Classics"], contentRating:"Adult", pages:796, words:340000, language:"English", series:null, description:"The passionate Dmitri, the cold intellectual Ivan, and the gentle religious Alyosha, three brothers whose story is intertwined with their despised father's murder.", warnings:["Violence","Murder","Death","Child Abuse","Alcoholism","Abuse"], tropes:["Mystery","Multiple POV","Tragedy","Redemption","Political Intrigue"], tags:["Philosophical","Dark","Literary","Family","Religious","Crime"] },
  { id:126, isbn:"9781501117015", title:"The House of the Spirits", author:"Isabel Allende", rating:4.4, genres:["Fiction"], contentRating:"Adult", pages:433, words:140000, language:"Spanish", series:null, description:"La saga de la familia Trueba a lo largo de varias generaciones, entrelazando el amor, la política y la magia en un país sudamericano.", warnings:["Violence","Sexual Assault","Death","Political Violence","War","Abuse"], tropes:["Multi-Generational","Magical Realism","Strong Female Lead","Political Intrigue"], tags:["Family","Historical","Political","Magical","Feminist","Epic"] },
  { id:127, isbn:"9780593655030", title:"Anxious Generation", author:"Jonathan Haidt", rating:4.4, genres:["Non-Fiction"], contentRating:"All Ages", pages:389, words:110000, language:"English", series:null, description:"An investigation into the collapse of youth mental health in the age of smartphones and social media, offering solutions for parents, schools, and communities.", warnings:["Mental Health","Suicide","Self-Harm"], tropes:[], tags:["Psychology","Education","Science","Personal Development","Family"] },
  { id:128, isbn:"9780441569595", title:"Neuromancer", author:"William Gibson", rating:4.2, genres:["Sci-Fi","Fiction"], contentRating:"Adult", pages:271, words:80000, language:"English", series:{name:"Sprawl Trilogy",number:1,status:"Completed"}, description:"Case was the sharpest data-thief in the matrix — until he crossed the wrong people. Now he has a chance at redemption through one last job.", warnings:["Violence","Drug Use","Death","Sexual Content","Strong Language"], tropes:["Anti-Hero","Heist","Cyberpunk","Redemption"], tags:["Futuristic","Action","Dark","Science","Psychological"] },
  { id:129, isbn:"9780385541213", title:"The Starless Sea", author:"Erin Morgenstern", rating:4.1, genres:["Fantasy","Fiction"], contentRating:"All Ages", pages:498, words:147000, language:"English", series:null, description:"Zachary Ezra Rawlins discovers a mysterious book hidden in the stacks of his university library, a book that contains a story from his own childhood.", warnings:[], tropes:["Quest","Mystery","Dual POV","Slow Burn","Meta-Fiction"], tags:["Fantasy","Literary","Atmospheric","Mystery","Romance","Art"] },
  { id:130, isbn:"9780063251922", title:"Demon Copperhead", author:"Barbara Kingsolver", rating:4.5, genres:["Fiction"], contentRating:"Adult", pages:560, words:175000, language:"English", series:null, description:"Set in the mountains of southern Appalachia, a modern retelling of David Copperfield through the eyes of a boy born to a teenage single mother in a single-wide trailer.", warnings:["Drug Use","Addiction","Child Abuse","Poverty","Death","Neglect","Violence"], tropes:["Coming of Age","Rags to Riches","Unreliable Narrator","Survival"], tags:["Literary","Contemporary","Dark","Southern","Emotional","Social Commentary"] },
  { id:131, isbn:"9780375703768", title:"House of Leaves", author:"Mark Z. Danielewski", rating:4.3, genres:["Fiction","Thriller"], contentRating:"Adult", pages:709, words:190000, language:"English", series:null, description:"A young family moves into a house on Ash Tree Lane and discovers it is somehow larger on the inside than it is on the outside.", warnings:["Violence","Death","Mental Health","Body Horror","Isolation","Psychological Abuse"], tropes:["Unreliable Narrator","Gothic","Mystery","Obsession","Meta-Fiction"], tags:["Horror","Psychological","Dark","Atmospheric","Experimental","Suspense"] },
  { id:132, isbn:"9780385547345", title:"Lessons in Chemistry", author:"Bonnie Garmus", rating:4.3, genres:["Fiction"], contentRating:"Adult", pages:400, words:112000, language:"English", series:null, description:"Chemist Elizabeth Zott is not your average woman. In fact, Elizabeth Zott would be the first to point out that there is no such thing as an average woman.", warnings:["Sexism","Sexual Assault","Death","Grief","Discrimination"], tropes:["Strong Female Lead","Slow Burn","Transformation","Fish Out of Water"], tags:["Feminist","Humor","Historical","Science","Romance","Inspirational"] },
  { id:133, isbn:"9780345391803", title:"The Hitchhiker's Guide to the Galaxy", author:"Douglas Adams", rating:4.5, genres:["Sci-Fi","Fiction"], contentRating:"All Ages", pages:193, words:46000, language:"English", series:{name:"The Hitchhiker's Guide",number:1,status:"Completed"}, description:"Seconds before Earth is demolished to make way for a galactic freeway, Arthur Dent is plucked off the planet by his friend Ford Prefect.", warnings:["Death","Destruction"], tropes:["Fish Out of Water","Unlikely Friendship","Satire","Quest"], tags:["Humor","Space","Adventure","Philosophical","Surreal"] },
  { id:134, isbn:"9780061689246", title:"Stardust", author:"Neil Gaiman", rating:4.4, genres:["Fantasy","Fiction","Romance"], contentRating:"All Ages", pages:248, words:62000, language:"English", series:null, description:"In the tranquil fields of England, a young man makes a rash promise and sets out on an unexpected journey to the mysterious land beyond the ancient wall.", warnings:["Violence","Death"], tropes:["Quest","Coming of Age","Star-Crossed Lovers","Transformation"], tags:["Adventure","Romance","Fantasy","Humor","Fairy Tale"] },
  { id:135, isbn:"9780063081918", title:"American Gods", author:"Neil Gaiman", rating:4.3, genres:["Fantasy","Fiction"], contentRating:"Adult", pages:541, words:183000, language:"English", series:null, description:"Shadow Moon, fresh out of prison, learns his wife has died. He meets the mysterious Mr. Wednesday, who recruits him into a war between old gods and new.", warnings:["Violence","Death","Sexual Content","Drug Use","Strong Language"], tropes:["Quest","Unlikely Friendship","Mythology","Mystery"], tags:["Fantasy","Mythology","Dark","Adventure","Philosophical","American"] },
  { id:136, isbn:"9781250899651", title:"Tress of the Emerald Sea", author:"Brandon Sanderson", rating:4.5, genres:["Fantasy","Fiction"], contentRating:"All Ages", pages:479, words:110000, language:"English", series:null, description:"The only life Tress has known is on her island home. But when the sorceress of the deadly Midnight Sea kidnaps the boy she loves, Tress must leave everything behind.", warnings:["Violence","Death","Poisoning"], tropes:["Quest","Strong Female Lead","Unlikely Hero","Found Family","Fish Out of Water"], tags:["Adventure","Humor","Romance","Fantasy","Fairy Tale"] },
  { id:137, isbn:"9781250899903", title:"Yumi and the Nightmare Painter", author:"Brandon Sanderson", rating:4.3, genres:["Fantasy","Fiction","Romance"], contentRating:"All Ages", pages:368, words:95000, language:"English", series:null, description:"Yumi stacks rocks and paints nightmares. Their lives couldn't be more different — until the day they suddenly wake up in each other's worlds.", warnings:["Violence","Death","Isolation"], tropes:["Body Swap","Enemies to Lovers","Slow Burn","Dual POV","Fish Out of Water"], tags:["Romance","Fantasy","Adventure","Humor","Asian-Inspired"] },
  { id:138, isbn:"9780571245246", title:"The Buried Giant", author:"Kazuo Ishiguro", rating:3.9, genres:["Fiction","Fantasy"], contentRating:"All Ages", pages:317, words:87000, language:"English", series:null, description:"In post-Arthurian Britain, an elderly Briton couple set out on a journey to find their long-lost son. A mysterious mist has settled over the land, erasing memories.", warnings:["Violence","Death","War","Memory Loss"], tropes:["Quest","Love Story","Slow Burn","Magical Realism"], tags:["Fantasy","Historical","Philosophical","Emotional","Literary"] },
  { id:139, isbn:"9780063250833", title:"Yellowface", author:"R.F. Kuang", rating:4.0, genres:["Fiction","Thriller"], contentRating:"Adult", pages:323, words:85000, language:"English", series:null, description:"Authors June Hayward and Athena Liu were supposed to be friends. When Athena dies in an accident, June steals her unpublished manuscript.", warnings:["Death","Racism","Manipulation","Strong Language","Harassment","Mental Health"], tropes:["Unreliable Narrator","Anti-Hero","Obsession","Satire"], tags:["Contemporary","Dark","Literary","Social Commentary","Psychological","Humor"] },
  { id:140, isbn:"9781451696196", title:"The Perks of Being a Wallflower", author:"Stephen Chbosky", rating:4.4, genres:["YA","Fiction"], contentRating:"Teen", pages:213, words:63000, language:"English", series:null, description:"Charlie is a shy freshman navigating the world of first dates, family drama, and new friends. He is both a wallflower and a witness to the world around him.", warnings:["Sexual Abuse","Drug Use","Mental Health","Suicide","Death","Strong Language","PTSD"], tropes:["Coming of Age","Found Family","Outcast","Mentor Figure"], tags:["Coming of Age","Literary","Friendship","Emotional","Contemporary"] },
  { id:141, isbn:"9780765382030", title:"The Three-Body Problem", author:"Cixin Liu", rating:4.3, genres:["Sci-Fi","Fiction"], contentRating:"Adult", pages:399, words:100000, language:"Chinese", series:{name:"Remembrance of Earth's Past",number:1,status:"Completed"}, description:"Set against the backdrop of China's Cultural Revolution, a secret military project sends signals into space, making contact with an alien civilization on the brink of destruction.", warnings:["Violence","Death","Political Violence","War","Existential Threat","Suicide"], tropes:["Mystery","Science Hero","Political Intrigue","First Contact"], tags:["Space","Science","Political","Dark","Philosophical","Suspense"] },
  { id:142, isbn:"9781594484360", title:"The Book of Night Women", author:"Marlon James", rating:4.3, genres:["Fiction"], contentRating:"Adult", pages:417, words:130000, language:"English", series:null, description:"Lilith is born into slavery on a Jamaican sugar plantation at the end of the eighteenth century. But her green eyes mark her as different and draw her into a world of rebellion.", warnings:["Slavery","Violence","Sexual Assault","Death","Racism","Torture","Graphic Violence"], tropes:["Strong Female Lead","Rebellion","Coming of Age","Survival"], tags:["Historical","Dark","Revolution","Literary","Feminist"] },
  { id:143, isbn:"9781250313072", title:"Ninth House", author:"Leigh Bardugo", rating:4.1, genres:["Fantasy","Fiction","Thriller"], contentRating:"Adult", pages:458, words:138000, language:"English", series:{name:"Alex Stern",number:1,status:"Ongoing"}, description:"Galaxy 'Alex' Stern is the most unlikely member of Yale's freshman class. A dropout with a dark past, she's given a scholarship and tasked with monitoring secret societies that practice real magic.", warnings:["Violence","Sexual Assault","Drug Use","Death","Abuse","Graphic Violence","PTSD"], tropes:["Dark Academic","Strong Female Lead","Mystery","Morally Grey Characters","Anti-Hero"], tags:["Dark","Academic","Mystery","Magic","Suspense","Urban Fantasy"] },
  { id:144, isbn:"9780399590504", title:"Educated: Memoir", author:"Tara Westover", rating:4.7, genres:["Non-Fiction","Memoir"], contentRating:"Adult", pages:334, words:97000, language:"English", series:null, description:"Born to survivalists in the mountains of Idaho, Tara Westover was seventeen the first time she set foot in a classroom.", warnings:["Abuse","Violence","Mental Health","Neglect","Injury"], tropes:[], tags:["Inspirational","Memoir","Education","Family"] },
  { id:145, isbn:"9780525522119", title:"My Year of Rest and Relaxation", author:"Ottessa Moshfegh", rating:3.9, genres:["Fiction"], contentRating:"Adult", pages:289, words:70000, language:"English", series:null, description:"A young woman in New York decides to sleep for an entire year with the help of a dubious psychiatrist's prescriptions. Set in 2000-2001 Manhattan.", warnings:["Drug Use","Death","Depression","Sexual Content","Mental Health","Eating Disorder","Strong Language"], tropes:["Anti-Hero","Transformation","Isolation"], tags:["Literary","Dark","Contemporary","Psychological","Satirical"] },
  { id:146, isbn:"9780441478125", title:"The Left Hand of Darkness", author:"Ursula K. Le Guin", rating:4.3, genres:["Sci-Fi","Fiction"], contentRating:"Adult", pages:286, words:80000, language:"English", series:null, description:"A human ambassador is sent to the planet Gethen, whose inhabitants can choose and change their gender. He must bridge the gulf between his own world and theirs.", warnings:["Violence","Death","Isolation","Betrayal"], tropes:["Fish Out of Water","Unlikely Friendship","Political Intrigue","Slow Burn"], tags:["Space","Political","LGBTQ+","Philosophical","Literary"] },
  { id:147, isbn:"9780553293357", title:"Foundation", author:"Isaac Asimov", rating:4.4, genres:["Sci-Fi","Fiction","Classics"], contentRating:"All Ages", pages:296, words:70000, language:"English", series:{name:"Foundation",number:1,status:"Completed"}, description:"For twelve thousand years the Galactic Empire has ruled supreme. Now it is dying. Only Hari Seldon, creator of the revolutionary science of psychohistory, can see into the future.", warnings:["Violence","Death","Political Violence"], tropes:["Political Intrigue","Prophecy","Multiple POV"], tags:["Space","Political","Science","Epic","Philosophical"] },
  { id:148, isbn:"9780807083109", title:"Kindred", author:"Octavia E. Butler", rating:4.5, genres:["Fiction","Sci-Fi"], contentRating:"Adult", pages:264, words:70000, language:"English", series:null, description:"Dana, a modern black woman, is suddenly drawn back repeatedly through time to the antebellum South, where she must ensure the survival of her white slaveholding ancestor.", warnings:["Slavery","Violence","Sexual Assault","Racism","Death","Whipping","Abuse"], tropes:["Time Travel","Survival","Strong Female Lead","Fish Out of Water"], tags:["Historical","Dark","Feminist","Literary","Philosophical"] },
  { id:149, isbn:"9780525642947", title:"House of Salt and Sorrows", author:"Erin A. Craig", rating:4.1, genres:["Fantasy","YA","Thriller"], contentRating:"Teen", pages:408, words:105000, language:"English", series:null, description:"Eight sisters. Eight deaths. Annaleigh lives in a manor by the sea, and when her sisters begin to die in suspicious ways, she investigates the family's dark secrets.", warnings:["Death","Violence","Horror","Grief","Gaslighting","Murder"], tropes:["Gothic","Mystery","Strong Female Lead","Slow Burn","Fairy Tale Retelling"], tags:["Mystery","Dark","Romance","Atmospheric","Horror","Fairy Tale"] },
  { id:150, isbn:"9781668002322", title:"The Spanish Love Deception", author:"Elena Armas", rating:4.1, genres:["Fiction","Romance"], contentRating:"Adult", pages:437, words:125000, language:"English", series:null, description:"Catalina Martín needs a date for her sister's wedding. She has four weeks to find one. She asks the last man on earth she'd want: Aaron Blackford.", warnings:["Sexual Content","Strong Language"], tropes:["Fake Dating","Enemies to Lovers","Forced Proximity","Slow Burn","Dual POV"], tags:["Romance","Humor","Contemporary","Travel"] },
  { id:151, isbn:"9780759555402", title:"The Inheritance Games", author:"Jennifer Lynn Barnes", rating:4.3, genres:["YA","Thriller","Fiction"], contentRating:"Teen", pages:384, words:95000, language:"English", series:{name:"The Inheritance Games",number:1,status:"Completed"}, description:"Avery Grambs has a plan for a better future — until billionaire Tobias Hawthorne dies and leaves her virtually his entire fortune.", warnings:["Death","Manipulation","Violence","Kidnapping"], tropes:["Mystery","Enemies to Lovers","Rags to Riches","Plot Twist","Slow Burn"], tags:["Mystery","Romance","Suspense","Contemporary","Puzzle"] },
  { id:152, isbn:"9780316074315", title:"The Luminaries", author:"Eleanor Catton", rating:3.9, genres:["Fiction","Mystery"], contentRating:"Adult", pages:832, words:300000, language:"English", series:null, description:"It is 1866, and Walter Moody arrives in the New Zealand goldfields to seek his fortune. On the night of his arrival, he stumbles upon a secret meeting of twelve local men.", warnings:["Violence","Death","Drug Use","Prostitution","Racism"], tropes:["Mystery","Multiple POV","Slow Burn","Plot Twist"], tags:["Historical","Mystery","Literary","Dark","Atmospheric"] },
  { id:153, isbn:"9781101971062", title:"Homegoing", author:"Yaa Gyasi", rating:4.5, genres:["Fiction"], contentRating:"Adult", pages:300, words:82000, language:"English", series:null, description:"Two half-sisters are born in different Ghanaian villages in the eighteenth century. This novel follows the parallel paths of their descendants through eight generations.", warnings:["Slavery","Violence","Racism","Death","Drug Use","Abuse","War"], tropes:["Multi-Generational","Dual POV","Survival","Strong Female Lead"], tags:["Historical","Family","Dark","Literary","Race","African-Inspired"] },
  { id:154, isbn:"9780735220690", title:"Eleanor Oliphant Is Completely Fine", author:"Gail Honeyman", rating:4.3, genres:["Fiction"], contentRating:"Adult", pages:327, words:88000, language:"English", series:null, description:"Eleanor Oliphant has learned how to survive. She wears the same clothes to work every day, eats the same meal every night, and avoids all unnecessary social contact.", warnings:["Child Abuse","Burns","Alcoholism","Isolation","Death","Mental Health"], tropes:["Found Family","Transformation","Unlikely Friendship","Outcast"], tags:["Contemporary","Humor","Emotional","Heartwarming","Literary"] },
  { id:155, isbn:"9780064410342", title:"Howl's Moving Castle", author:"Diana Wynne Jones", rating:4.6, genres:["Fantasy","Fiction","Romance"], contentRating:"All Ages", pages:329, words:80000, language:"English", series:{name:"Howl's Moving Castle",number:1,status:"Completed"}, description:"Sophie has the great misfortune of being the eldest of three daughters, destined to fail miserably. When she unwittingly attracts the ire of the Witch of the Waste, Sophie is cursed.", warnings:["Violence","Curses"], tropes:["Enemies to Lovers","Strong Female Lead","Transformation","Slow Burn","Fish Out of Water"], tags:["Fantasy","Romance","Humor","Adventure","Magic","Fairy Tale"] },
  { id:156, isbn:"9780062457790", title:"They Both Die at the End", author:"Adam Silvera", rating:4.3, genres:["YA","Fiction","Romance"], contentRating:"Teen", pages:373, words:95000, language:"English", series:null, description:"On September 5, a little after midnight, Death-Cast calls Mateo and Rufus to tell them they're both going to die today. They have one last day to live.", warnings:["Death","Grief","Violence","Homophobia","Depression"], tropes:["Star-Crossed Lovers","Slow Burn","Tragic Ending","Unlikely Friendship"], tags:["LGBTQ+","Romance","Emotional","Contemporary","Coming of Age","Dark"] },
  { id:157, isbn:"9780812511819", title:"The Wheel of Time: The Eye of the World", author:"Robert Jordan", rating:4.4, genres:["Fantasy","Fiction"], contentRating:"Teen", pages:782, words:310000, language:"English", series:{name:"The Wheel of Time",number:1,status:"Completed"}, description:"The Wheel of Time turns and Ages come and go. In the Third Age, Rand al'Thor and his friends are swept away from their village by a mysterious woman.", warnings:["Violence","Death","War"], tropes:["Chosen One","Quest","Found Family","Coming of Age","Prophecy"], tags:["Epic","Adventure","Magic","War","Political"] },
  { id:158, isbn:"9780553588941", title:"The Lies of Locke Lamora", author:"Scott Lynch", rating:4.5, genres:["Fantasy","Fiction"], contentRating:"Adult", pages:499, words:165000, language:"English", series:{name:"Gentleman Bastard",number:1,status:"Ongoing"}, description:"An orphan's life is changed when he is taken in by a con artist who teaches him the art of the swindle. Locke Lamora dodges death, plays with fire, and steals from the rich.", warnings:["Violence","Death","Strong Language","Torture","Child Abuse"], tropes:["Heist","Found Family","Anti-Hero","Morally Grey Characters","Slow Burn"], tags:["Adventure","Action","Humor","Dark","Crime"] },
  { id:159, isbn:"9780316055437", title:"The Goldfinch", author:"Donna Tartt", rating:4.1, genres:["Fiction"], contentRating:"Adult", pages:771, words:275000, language:"English", series:null, description:"Theo Decker, a 13-year-old New Yorker, miraculously survives a catastrophe. The aftermath of the disaster plunges him into a miserable spiral of homelessness and crime.", warnings:["Violence","Death","Drug Use","Grief","Terrorism","Theft","Strong Language"], tropes:["Coming of Age","Tragedy","Unreliable Narrator","Obsession"], tags:["Literary","Art","Dark","Contemporary","Emotional","Crime"] },
  { id:160, isbn:"9780553380958", title:"Snow Crash", author:"Neal Stephenson", rating:4.2, genres:["Sci-Fi","Fiction"], contentRating:"Adult", pages:440, words:128000, language:"English", series:null, description:"In a future America, Hiro Protagonist delivers pizza for the Mafia and is a hacker warrior prince in the Metaverse. A new drug is spreading — the Snow Crash.", warnings:["Violence","Drug Use","Sexual Content","Strong Language","Death"], tropes:["Anti-Hero","Cyberpunk","Heist","Satire"], tags:["Futuristic","Action","Humor","Science","Dark"] },
  { id:161, isbn:"9781400079988", title:"War and Peace", author:"Leo Tolstoy", rating:4.5, genres:["Fiction","Classics"], contentRating:"Adult", pages:1225, words:580000, language:"English", series:null, description:"The epic tale of five aristocratic Russian families during the Napoleonic Wars, interweaving history, philosophy, and the personal journeys of its characters.", warnings:["Violence","War","Death","Injury","Grief"], tropes:["Multiple POV","Multi-Generational","Political Intrigue","Love Story","Coming of Age"], tags:["Historical","War","Epic","Romance","Political","Philosophical"] },
  { id:162, isbn:"9780141192581", title:"The Phantom of the Opera", author:"Gaston Leroux", rating:4.2, genres:["Fiction","Romance","Classics"], contentRating:"Teen", pages:279, words:80000, language:"French", series:null, description:"Sous l'Opéra Garnier de Paris, un génie musical défiguré hante les coulisses et tombe amoureux d'une jeune soprano, Christine Daaé.", warnings:["Violence","Death","Kidnapping","Obsession","Murder"], tropes:["Obsession","Love Triangle","Gothic","Forbidden Love","Tragedy"], tags:["Romance","Gothic","Dark","Music","Mystery","Horror"] },
  { id:163, isbn:"9780062085481", title:"Shatter Me", author:"Tahereh Mafi", rating:4.1, genres:["YA","Sci-Fi","Romance"], contentRating:"Teen", pages:338, words:73000, language:"English", series:{name:"Shatter Me",number:1,status:"Completed"}, description:"Juliette hasn't touched anyone in exactly 264 days. Her touch is fatal, and she's been locked away. But now, the Reestablishment wants to use her as a weapon.", warnings:["Violence","Imprisonment","Oppressive Government","Death","PTSD"], tropes:["Enemies to Lovers","Chosen One","Strong Female Lead","Dystopia","Slow Burn"], tags:["Romance","Action","Dark","Futuristic","Revolution"] },
  { id:164, isbn:"9781442408937", title:"Aristotle and Dante Discover the Secrets of the Universe", author:"Benjamin Alire Sáenz", rating:4.5, genres:["YA","Fiction","Romance"], contentRating:"Teen", pages:359, words:75000, language:"English", series:{name:"Aristotle and Dante",number:1,status:"Completed"}, description:"Fifteen-year-old Ari Mendoza is angry and alone. Then he meets Dante Quintana, who is anything but angry and alone. An unexpected friendship turns into something more.", warnings:["Violence","Homophobia","Hate Crime"], tropes:["Friends to Lovers","Coming of Age","Slow Burn","Unlikely Friendship"], tags:["LGBTQ+","Romance","Coming of Age","Contemporary","Emotional","Family"] },
  { id:165, isbn:"9780425290477", title:"The Traveling Cat Chronicles", author:"Hiro Arikawa", rating:4.4, genres:["Fiction"], contentRating:"All Ages", pages:256, words:55000, language:"Japanese", series:null, description:"Nana is a cat who finds a home with a kind young man named Satoru. When circumstances force Satoru to give Nana away, they embark on a journey across Japan.", warnings:["Death","Terminal Illness","Grief"], tropes:["Unlikely Friendship","Quest","Found Family"], tags:["Heartwarming","Adventure","Emotional","Nature","Friendship"] },
  { id:166, isbn:"9781250236210", title:"A Psalm for the Wild-Built", author:"Becky Chambers", rating:4.2, genres:["Sci-Fi","Fiction"], contentRating:"All Ages", pages:160, words:40000, language:"English", series:{name:"Monk & Robot",number:1,status:"Completed"}, description:"In a world where robots gained sentience and walked away from their makers, monk Sibling Dex sets out into the wilderness and encounters a robot for the first time.", warnings:[], tropes:["Unlikely Friendship","Quest","Fish Out of Water","Slow Burn"], tags:["Philosophical","Nature","Heartwarming","Inspirational","Futuristic","Cozy"] },
  { id:167, isbn:"9780312375065", title:"The Devotion of Suspect X", author:"Keigo Higashino", rating:4.3, genres:["Fiction","Mystery","Thriller"], contentRating:"Adult", pages:298, words:78000, language:"Japanese", series:null, description:"A brilliant mathematician helps his neighbor cover up a murder, constructing an elaborate alibi that challenges even the most skilled detective.", warnings:["Murder","Death","Violence","Stalking","Domestic Violence"], tropes:["Mystery","Plot Twist","Obsession","Anti-Hero"], tags:["Mystery","Suspense","Psychological","Crime","Dark"] },
  { id:168, isbn:"9780063204676", title:"Vita Nostra", author:"Marina and Sergey Dyachenko", rating:4.1, genres:["Fantasy","Fiction"], contentRating:"Adult", pages:384, words:100000, language:"English", series:null, description:"Sasha's summer vacation on the beach is interrupted by a stranger who tasks her with increasingly strange demands, then invites her to a school where reality itself is the subject.", warnings:["Violence","Manipulation","Body Horror","Psychological Abuse","Death"], tropes:["School Setting","Coming of Age","Chosen One","Transformation"], tags:["Dark","Academic","Surreal","Philosophical","Magic"] },
  { id:169, isbn:"9780006510116", title:"Naomi's Room", author:"Jonathan Aycliffe", rating:4.1, genres:["Fiction","Thriller"], contentRating:"Adult", pages:208, words:55000, language:"English", series:null, description:"A Cambridge professor's young daughter vanishes on Christmas Eve. When inexplicable occurrences begin in their home, they discover the terrifying truth.", warnings:["Child Death","Violence","Horror","Grief","Death","Psychological Abuse"], tropes:["Gothic","Mystery","Obsession","Tragedy"], tags:["Horror","Dark","Atmospheric","Supernatural","Psychological"] },
  { id:170, isbn:"9780143035008", title:"Anna Karenina", author:"Leo Tolstoy", rating:4.4, genres:["Fiction","Romance","Classics"], contentRating:"Adult", pages:864, words:349000, language:"English", series:null, description:"The story of the doomed love affair between the sensuous and rebellious Anna and the dashing officer, Count Vronsky, set against the backdrop of Russian society.", warnings:["Infidelity","Suicide","Death","Drug Use","Domestic Conflict"], tropes:["Forbidden Love","Star-Crossed Lovers","Tragedy","Multiple POV","Slow Burn"], tags:["Romance","Historical","Literary","Political","Family","Dark"] },
  { id:171, isbn:"9780380730407", title:"Rebecca", author:"Daphne du Maurier", rating:4.4, genres:["Fiction","Mystery","Romance"], contentRating:"Adult", pages:380, words:118000, language:"English", series:null, description:"Last night I dreamt I went to Manderley again. A shy young bride arrives at the imposing estate of Manderley, haunted by the legacy of her husband's first wife, Rebecca.", warnings:["Death","Manipulation","Domestic Violence","Murder","Suicide","Gaslighting"], tropes:["Gothic","Mystery","Unreliable Narrator","Strong Female Lead","Obsession"], tags:["Mystery","Romance","Gothic","Atmospheric","Dark","Psychological"] },
  { id:172, isbn:"9780802156983", title:"Girl, Woman, Other", author:"Bernardine Evaristo", rating:4.2, genres:["Fiction"], contentRating:"Adult", pages:452, words:120000, language:"English", series:null, description:"Twelve characters — mostly women, mostly Black, mostly British — weave their stories across decades. Their lives connect in ways they never anticipated.", warnings:["Racism","Sexual Content","Homophobia","Violence","Death","Sexism"], tropes:["Multiple POV","Multi-Generational","Found Family","Strong Female Lead"], tags:["Literary","LGBTQ+","Feminist","Contemporary","Family","Social Commentary"] },
  { id:173, isbn:"9781984880987", title:"The Thursday Murder Club", author:"Richard Osman", rating:4.2, genres:["Fiction","Mystery"], contentRating:"All Ages", pages:369, words:95000, language:"English", series:{name:"The Thursday Murder Club",number:1,status:"Ongoing"}, description:"In a peaceful retirement village, four unlikely friends meet weekly to investigate cold cases. Then a real murder occurs on their doorstep.", warnings:["Murder","Death","Violence"], tropes:["Found Family","Mystery","Unlikely Friendship","Multiple POV","Humor"], tags:["Mystery","Humor","Contemporary","Friendship","Cozy"] },
  { id:174, isbn:"9781501160769", title:"Beartown", author:"Fredrik Backman", rating:4.4, genres:["Fiction"], contentRating:"Adult", pages:418, words:120000, language:"English", series:{name:"Beartown",number:1,status:"Completed"}, description:"A small forest community is about to be put on the map. The junior ice hockey team has a shot at the national semi-finals, but a violent act threatens to tear it apart.", warnings:["Sexual Assault","Violence","Bullying","Alcoholism","Death","Homophobia"], tropes:["Multiple POV","Coming of Age","Strong Female Lead","Tragedy"], tags:["Contemporary","Dark","Sports","Family","Social Commentary","Emotional"] },
  { id:175, isbn:"9780765326362", title:"The Stormlight Archive: Words of Radiance", author:"Brandon Sanderson", rating:4.8, genres:["Fantasy","Fiction"], contentRating:"Teen", pages:1087, words:398000, language:"English", series:{name:"The Stormlight Archive",number:2,status:"Ongoing"}, description:"The war with the Parshendi has entered a new phase. Shallan Davar finally arrives at the Shattered Plains with devastating news. Kaladin faces new threats.", warnings:["Violence","Death","War","Slavery","Mental Health","PTSD"], tropes:["Multiple POV","Found Family","Slow Burn","Strong Female Lead","Redemption"], tags:["Epic","Adventure","War","Magic","Political"] },
  { id:176, isbn:"9780060853983", title:"Good Omens", author:"Neil Gaiman & Terry Pratchett", rating:4.5, genres:["Fantasy","Fiction"], contentRating:"All Ages", pages:288, words:100000, language:"English", series:null, description:"The world will end on a Saturday. Next Saturday, in fact. The apocalypse is nigh, and an angel and a demon have grown rather fond of the world.", warnings:["Death","Violence","Apocalypse"], tropes:["Unlikely Friendship","Satire","Found Family","Quest"], tags:["Humor","Fantasy","Philosophical","Adventure","Friendship"] },
  { id:177, isbn:"9780316029186", title:"The Witcher: The Last Wish", author:"Andrzej Sapkowski", rating:4.3, genres:["Fantasy","Fiction"], contentRating:"Adult", pages:288, words:75000, language:"English", series:{name:"The Witcher",number:1,status:"Completed"}, description:"Geralt of Rivia is a witcher — a man whose magic powers, enhanced by long training and a mysterious elixir, have made him a brilliant fighter and deadly hunter of monsters.", warnings:["Violence","Death","Sexual Content","Strong Language","Monsters"], tropes:["Anti-Hero","Quest","Morally Grey Characters","Fairy Tale Retelling"], tags:["Adventure","Dark","Action","Magic","Humor","Monsters"] },
  { id:178, isbn:"9780399180996", title:"Spinning Silver", author:"Naomi Novik", rating:4.3, genres:["Fantasy","Fiction"], contentRating:"Teen", pages:466, words:135000, language:"English", series:null, description:"Miryem is the daughter of a moneylender who can't collect his debts. When she takes over his business, she turns silver into gold — literally attracting the attention of a winter king.", warnings:["Violence","Death","Abuse","Anti-Semitism","Cold"], tropes:["Strong Female Lead","Multiple POV","Fairy Tale Retelling","Slow Burn","Enemies to Lovers"], tags:["Fantasy","Romance","Dark","Magic","Historical","Fairy Tale"] },
  { id:179, isbn:"9781524798659", title:"Malibu Rising", author:"Taylor Jenkins Reid", rating:4.1, genres:["Fiction"], contentRating:"Adult", pages:369, words:98000, language:"English", series:null, description:"Malibu, August 1983. It's the day of Nina Riva's famous end-of-summer party, and anticipation is at a fever pitch. The Rivas are the epicenter of Malibu's social scene.", warnings:["Sexual Content","Drug Use","Alcoholism","Infidelity","Fire","Death"], tropes:["Multiple POV","Multi-Generational","Slow Burn","Found Family"], tags:["Contemporary","Family","Historical","Romance","Summer","Drama"] },
  { id:180, isbn:"9780062439598", title:"The Hating Game", author:"Sally Thorne", rating:4.0, genres:["Fiction","Romance"], contentRating:"Adult", pages:375, words:98000, language:"English", series:null, description:"Nemeses. That's what Lucy and Joshua are — at least that's what Lucy tells herself. They sit across from each other, exchanging insults and hatred.", warnings:["Sexual Content","Strong Language"], tropes:["Enemies to Lovers","Forced Proximity","Slow Burn","Dual POV"], tags:["Romance","Humor","Contemporary","Office"] },
  { id:181, isbn:"9781335430991", title:"Before the Coffee Gets Cold", author:"Toshikazu Kawaguchi", rating:4.0, genres:["Fiction","Fantasy"], contentRating:"All Ages", pages:213, words:48000, language:"Japanese", series:{name:"Before the Coffee Gets Cold",number:1,status:"Ongoing"}, description:"In a small Tokyo café, customers can travel back in time. But there are many rules that must be followed, and the journey is not without risk.", warnings:["Death","Grief","Terminal Illness"], tropes:["Time Travel","What If","Transformation"], tags:["Emotional","Philosophical","Contemporary","Heartwarming","Fantasy"] },
  { id:182, isbn:"9780525555377", title:"Turtles All the Way Down", author:"John Green", rating:4.0, genres:["YA","Fiction"], contentRating:"Teen", pages:286, words:67000, language:"English", series:null, description:"Aza is trying to be a good daughter, a good friend, a good student, and maybe even a good detective — while living with tightening spirals of her own thoughts.", warnings:["Mental Health","OCD","Anxiety","Self-Harm","Death","Grief"], tropes:["Coming of Age","Mystery","Unlikely Friendship"], tags:["Contemporary","Emotional","Coming of Age","Psychological","Romance"] },
  { id:183, isbn:"9781101904220", title:"Dark Matter: The Blake Crouch Novel", author:"Blake Crouch", rating:4.4, genres:["Sci-Fi","Fiction","Thriller"], contentRating:"Adult", pages:342, words:85000, language:"English", series:null, description:"Jason Dessen is walking home through the streets of Chicago when he's kidnapped by a masked attacker. He wakes up strapped to a gurney, surrounded by strangers.", warnings:["Violence","Death","Kidnapping","Drug Use","Existential Threat"], tropes:["What If","Multiple Realities","Love Story","Plot Twist"], tags:["Suspense","Science","Romance","Action","Psychological"] },
  { id:184, isbn:"9781635570304", title:"The Priory of the Orange Tree", author:"Samantha Shannon", rating:4.2, genres:["Fantasy","Fiction"], contentRating:"Adult", pages:848, words:250000, language:"English", series:null, description:"A world divided. A queendom without an heir. An ancient enemy awakens.", warnings:["Violence","Death","War","Sexual Content"], tropes:["Strong Female Lead","Multiple POV","Prophecy","Slow Burn","Fae"], tags:["Epic","Adventure","LGBTQ+","Dragons","Political","Feminist"] },
  { id:185, isbn:"9781982171582", title:"We Are Not Like Them", author:"Christine Pride & Jo Piazza", rating:4.2, genres:["Fiction"], contentRating:"Adult", pages:336, words:90000, language:"English", series:null, description:"Two lifelong best friends — one Black, one white — are torn apart when a police shooting devastates their community.", warnings:["Racism","Violence","Gun Violence","Death","Grief","Pregnancy Loss"], tropes:["Dual POV","Found Family","Strong Female Lead"], tags:["Contemporary","Social Commentary","Race","Emotional","Family","Friendship"] },
  { id:186, isbn:"9781472223791", title:"Hamnet", author:"Maggie O'Farrell", rating:4.3, genres:["Fiction"], contentRating:"Adult", pages:320, words:88000, language:"English", series:null, description:"On a summer's day in 1596, a girl in Stratford-upon-Avon takes to her bed with a fever. Her twin brother, Hamnet, searches for help.", warnings:["Death","Child Death","Grief","Illness","Plague"], tropes:["Dual POV","Tragedy","Strong Female Lead","Slow Burn"], tags:["Historical","Literary","Emotional","Family","Dark"] },
  { id:187, isbn:"9780525541905", title:"Such a Fun Age", author:"Kiley Reid", rating:4.0, genres:["Fiction"], contentRating:"Adult", pages:310, words:80000, language:"English", series:null, description:"Emira Tucker is a twenty-five-year-old babysitter to a wealthy Philadelphia family. One night, an incident at the supermarket leads her to confront the dynamics of race, privilege, and identity.", warnings:["Racism","Discrimination","Manipulation","Strong Language"], tropes:["Dual POV","Plot Twist","Misunderstanding","Social Critique"], tags:["Contemporary","Social Commentary","Race","Humor","Literary"] },
  { id:188, isbn:"9781338635171", title:"The Ballad of Songbirds and Snakes", author:"Suzanne Collins", rating:4.1, genres:["YA","Sci-Fi","Fiction"], contentRating:"Teen", pages:517, words:140000, language:"English", series:{name:"The Hunger Games",number:0,status:"Completed"}, description:"Ambition will fuel him. Competition will drive him. But power has its price. It is the morning of the reaping for the Tenth Hunger Games.", warnings:["Violence","Death","Starvation","War","Oppressive Government","Animal Death"], tropes:["Coming of Age","Anti-Hero","Political Intrigue","Morally Grey Characters","Slow Burn"], tags:["Action","Dark","Political","Revolution","Futuristic","Prequel"] },
  { id:189, isbn:"9781643751108", title:"Matrix", author:"Lauren Groff", rating:3.9, genres:["Fiction"], contentRating:"Adult", pages:260, words:68000, language:"English", series:null, description:"Cast out of the royal court, seventeen-year-old Marie de France is sent to a half-starved abbey. Over decades, she transforms it into a thriving community of women.", warnings:["Violence","Death","Starvation","Religious Themes"], tropes:["Strong Female Lead","Transformation","Political Intrigue","Found Family"], tags:["Historical","Feminist","Literary","Religious","Dark","Inspirational"] },
  { id:190, isbn:"9780593101537", title:"The Personal Librarian", author:"Marie Benedict & Victoria Christopher Murray", rating:4.3, genres:["Fiction"], contentRating:"Adult", pages:368, words:100000, language:"English", series:null, description:"Belle da Costa Greene is hired by J.P. Morgan to curate his personal library. What he doesn't know is that she is hiding a secret that could destroy her career.", warnings:["Racism","Discrimination","Death","Infidelity","Identity Crisis"], tropes:["Strong Female Lead","Forbidden Love","Dual Identity","Slow Burn"], tags:["Historical","Feminist","Literary","Art","Race","Romance"] },
  { id:191, isbn:"9780593462034", title:"House of Hollow", author:"Krystal Sutherland", rating:4.0, genres:["YA","Fantasy","Thriller"], contentRating:"Teen", pages:293, words:75000, language:"English", series:null, description:"Three sisters went missing as children. When they came back, they were changed. Now one has vanished again, and the youngest must unravel the mystery.", warnings:["Violence","Death","Body Horror","Missing Persons","Dark Imagery"], tropes:["Gothic","Mystery","Strong Female Lead","Siblings","Dark Secret"], tags:["Horror","Dark","Mystery","Fantasy","Atmospheric","Suspense"] },
  { id:192, isbn:"9781534441606", title:"Legendborn", author:"Tracy Deonn", rating:4.4, genres:["Fantasy","YA","Fiction"], contentRating:"Teen", pages:501, words:140000, language:"English", series:{name:"The Legendborn Cycle",number:1,status:"Ongoing"}, description:"After her mother dies in an accident, Bree Matthews discovers a secret society of Arthurian legend descendants at UNC Chapel Hill — and her own powerful heritage.", warnings:["Violence","Death","Grief","Racism","Strong Language","Blood Magic"], tropes:["Chosen One","School Setting","Strong Female Lead","Enemies to Lovers","Coming of Age"], tags:["Magic","Adventure","Romance","Dark","Academic","African-Inspired"] },
  { id:193, isbn:"9780375704024", title:"Norwegian Wood", author:"Haruki Murakami", rating:4.2, genres:["Fiction","Romance"], contentRating:"Adult", pages:296, words:85000, language:"Japanese", series:null, description:"A young college student in Tokyo navigates love, loss, and the complexity of human connections after the suicide of his closest friend.", warnings:["Suicide","Death","Sexual Content","Depression","Mental Health","Self-Harm"], tropes:["Love Triangle","Coming of Age","Tragic Ending"], tags:["Romance","Literary","Coming of Age","Emotional","Contemporary"] },
  { id:194, isbn:"9780141439549", title:"Middlemarch", author:"George Eliot", rating:4.4, genres:["Fiction","Classics"], contentRating:"All Ages", pages:880, words:316000, language:"English", series:null, description:"Set in the fictitious Midlands town of Middlemarch during the period 1829–32, the novel follows several distinct storylines linked by the common theme of reforming ideals.", warnings:["Death","Grief","Financial Ruin"], tropes:["Multiple POV","Slow Burn","Love Story","Class Differences","Transformation"], tags:["Historical","Literary","Romance","Social Commentary","Political"] },
  { id:195, isbn:"9788408163435", title:"La sombra del viento", author:"Carlos Ruiz Zafón", rating:4.5, genres:["Fiction","Mystery"], contentRating:"Teen", pages:487, words:145000, language:"Spanish", series:{name:"El Cementerio de los Libros Olvidados",number:1,status:"Completed"}, description:"Daniel Sempere descubre un libro misterioso en el Cementerio de los Libros Olvidados. Al investigar al autor, se ve inmerso en el pasado oscuro de Barcelona.", warnings:["Violence","Death","War","Fire","Manipulation","Child Abuse"], tropes:["Mystery","Coming of Age","Gothic","Dual POV"], tags:["Mystery","Historical","Gothic","Romance","Literary","Atmospheric"] },
  { id:196, isbn:"9780385474542", title:"Things Fall Apart", author:"Chinua Achebe", rating:4.2, genres:["Fiction","Classics"], contentRating:"Teen", pages:209, words:50000, language:"English", series:null, description:"Okonkwo is one of the greatest men of Umuofia. But when missionaries arrive, the clan's traditions are challenged and Okonkwo's world begins to fall apart.", warnings:["Violence","Death","Child Death","Suicide","Cultural Destruction","Domestic Violence"], tropes:["Tragedy","Coming of Age","Political Intrigue","Anti-Hero"], tags:["Historical","Literary","Political","African-Inspired","Dark","Family"] },
  { id:197, isbn:"9781400033423", title:"Song of Solomon", author:"Toni Morrison", rating:4.4, genres:["Fiction","Classics"], contentRating:"Adult", pages:337, words:100000, language:"English", series:null, description:"Milkman Dead was born shortly after an insurance agent hurled himself off the roof of Mercy Hospital. For the rest of his life, Milkman will be trying to fly.", warnings:["Violence","Death","Racism","Sexual Content","Domestic Violence","Murder"], tropes:["Coming of Age","Quest","Multi-Generational","Magical Realism"], tags:["Literary","Family","Historical","Dark","Philosophical","African-American"] },
  { id:198, isbn:"9780156013987", title:"Le Petit Prince", author:"Antoine de Saint-Exupéry", rating:4.6, genres:["Fiction","Classics"], contentRating:"All Ages", pages:96, words:17000, language:"French", series:null, description:"Un aviateur, échoué dans le désert du Sahara, rencontre un petit prince venu d'une autre planète. Ensemble, ils explorent les questions fondamentales de la vie.", warnings:["Death"], tropes:["Quest","Mentor Figure","Coming of Age","Unlikely Friendship"], tags:["Philosophical","Inspirational","Adventure","Fantasy","Emotional"] },
  { id:199, isbn:"9780142437223", title:"Inferno", author:"Dante Alighieri", rating:4.3, genres:["Fiction","Classics"], contentRating:"Adult", pages:432, words:85000, language:"Italian", series:{name:"The Divine Comedy",number:1,status:"Completed"}, description:"Nel mezzo del cammin di nostra vita, Dante si ritrova in una selva oscura. Guidato da Virgilio, intraprende un viaggio attraverso i nove cerchi dell'Inferno.", warnings:["Violence","Death","Torture","Religious Themes","Graphic Imagery"], tropes:["Quest","Mentor Figure","Descent"], tags:["Philosophical","Dark","Religious","Epic","Literary","Adventure"] },
  { id:200, isbn:"9781101906118", title:"The Vegetarian", author:"Han Kang", rating:3.9, genres:["Fiction"], contentRating:"Adult", pages:188, words:42000, language:"Korean", series:null, description:"Before the nightmare, Yeong-hye and her husband lived an unremarkable life. But when Yeong-hye begins to reject food, her family's attempt to reassert control leads to devastating consequences.", warnings:["Self-Harm","Sexual Assault","Eating Disorder","Mental Health","Violence","Death","Domestic Violence","Manipulation"], tropes:["Multiple POV","Transformation","Anti-Hero","Tragedy"], tags:["Literary","Dark","Psychological","Feminist","Surreal","Philosophical"] },
];

// ─── Filter Options ───
const ALL_GENRES = [...new Set(BOOKS_DB.flatMap(b => b.genres))].sort();
const ALL_WARNINGS = [...new Set(BOOKS_DB.flatMap(b => b.warnings))].sort();
const ALL_TROPES = [...new Set(BOOKS_DB.flatMap(b => b.tropes))].sort();
const ALL_TAGS = [...new Set(BOOKS_DB.flatMap(b => b.tags))].sort();
const ALL_LANGUAGES = [...new Set(BOOKS_DB.map(b => b.language))].sort();
const CONTENT_RATINGS = ["All Ages", "Teen", "Adult"];

// ─── Components ───
const StarRating = ({ rating }) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.3;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span style={{ color: C.copper, fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "1px" }}>
      {"★".repeat(full)}{half ? "⯪" : ""}{"☆".repeat(empty)}
      <span style={{ color: C.cream, marginLeft: "4px", fontWeight: 600, fontSize: "13px" }}>{rating}</span>
    </span>
  );
};

const Badge = ({ text, color = C.teal, bg, border }) => (
  <span style={{
    display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
    color, background: bg || "transparent", border: border || `1.5px solid ${color}`,
    letterSpacing: "0.3px", whiteSpace: "nowrap",
  }}>{text}</span>
);

const ContentBadge = ({ rating }) => {
  const bg = { "All Ages": "#35605A", "Teen": "#C27A3A", "Adult": "#8B3A3A" };
  return (
    <span style={{
      position: "absolute", top: 8, right: 8, background: bg[rating] || C.teal,
      color: "#fff", fontSize: "10px", fontWeight: 700, padding: "3px 8px",
      borderRadius: "4px", textTransform: "uppercase", letterSpacing: "0.5px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
    }}>{rating}</span>
  );
};

const MultiSelect = ({ label, options, selected, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", marginBottom: "8px" }}>
      {label && <div style={{ fontSize: "11px", fontWeight: 700, color: C.copper, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>{label}</div>}
      <div onClick={() => setOpen(!open)} style={{
        background: "rgba(43,30,47,0.6)", border: "1px solid rgba(194,122,58,0.3)", borderRadius: "8px",
        padding: "8px 12px", cursor: "pointer", fontSize: "13px", color: C.cream,
        display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: "38px",
      }}>
        <span style={{ opacity: selected.length ? 1 : 0.5 }}>{selected.length ? `${selected.length} selected` : placeholder || "Select..."}</span>
        <span style={{ transform: open ? "rotate(180deg)" : "none", transition: "0.2s" }}>▾</span>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
          background: "#2B1E2F", border: "1px solid rgba(194,122,58,0.3)", borderRadius: "8px",
          maxHeight: "200px", overflowY: "auto", marginTop: "4px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        }}>
          {options.map(opt => (
            <div key={opt} onClick={() => onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt])} style={{
              padding: "8px 12px", cursor: "pointer", fontSize: "12px",
              color: selected.includes(opt) ? C.copper : C.cream,
              background: selected.includes(opt) ? "rgba(194,122,58,0.15)" : "transparent",
              display: "flex", alignItems: "center", gap: "8px",
            }}>
              <span style={{
                width: "16px", height: "16px", borderRadius: "3px", display: "inline-flex",
                alignItems: "center", justifyContent: "center", fontSize: "10px",
                border: `1.5px solid ${selected.includes(opt) ? C.copper : "rgba(232,220,203,0.3)"}`,
                background: selected.includes(opt) ? C.copper : "transparent", color: "#fff",
              }}>{selected.includes(opt) ? "✓" : ""}</span>
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Dropdown = ({ label, value, onChange, options, placeholder }) => (
  <div style={{ marginBottom: "8px" }}>
    {label && <div style={{ fontSize: "11px", fontWeight: 700, color: C.copper, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>{label}</div>}
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      width: "100%", background: "rgba(43,30,47,0.6)", border: "1px solid rgba(194,122,58,0.3)",
      borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: C.cream,
      cursor: "pointer", appearance: "none",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23C27A3A' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
    }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o} value={o} style={{ background: "#2B1E2F", color: C.cream }}>{o}</option>)}
    </select>
  </div>
);

const CollapsibleSection = ({ title, children, defaultOpen = false, color = C.teal }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: "12px" }}>
      <div onClick={() => setOpen(!open)} style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        cursor: "pointer", padding: "8px 0", borderBottom: "1px solid rgba(232,220,203,0.1)",
      }}>
        <span style={{ fontSize: "12px", fontWeight: 700, color, letterSpacing: "1px", textTransform: "uppercase" }}>{title}</span>
        <span style={{ color, transform: open ? "rotate(180deg)" : "none", transition: "0.2s", fontSize: "14px" }}>▾</span>
      </div>
      {open && <div style={{ paddingTop: "10px" }}>{children}</div>}
    </div>
  );
};

const BookCover = ({ book, style = {} }) => {
  const [err, setErr] = useState(false);
  const bgColors = ["#4A2C23", "#35605A", "#5B6C5D", "#2B1E2F", "#6B3A2A"];
  const bg = bgColors[book.id % bgColors.length];
  const coverUrl = book.isbn ? `https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg` : null;

  if (coverUrl && !err) {
    return (
      <div style={{ width:"100%",height:"100%",position:"relative",...style }}>
        <img src={coverUrl} alt={book.title} onError={()=>setErr(true)}
          style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }} />
      </div>
    );
  }
  return (
    <div style={{
      width: "100%", height: "100%", background: `linear-gradient(145deg, ${bg}, ${bg}dd)`,
      display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
      padding: "16px", textAlign: "center", position: "relative", ...style,
    }}>
      <div style={{ fontSize: "14px", fontWeight: 700, color: C.cream, lineHeight: 1.3, marginBottom: "8px" }}>{book.title}</div>
      <div style={{ fontSize: "10px", color: "rgba(232,220,203,0.6)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{book.author}</div>
    </div>
  );
};

// ─── Main App ───
export default function BookApp() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isGuest, isAuthenticated, signOut } = useAuth();

  // Redirect if not logged in AND not guest
  useEffect(() => {
    if (!authLoading && !user && !isGuest) navigate("/");
  }, [user, authLoading, isGuest, navigate]);

  // Track page view + session
  useEffect(() => {
    const views = JSON.parse(localStorage.getItem("rr_pageviews") || "[]");
    views.push({ page: "app", timestamp: new Date().toISOString() });
    localStorage.setItem("rr_pageviews", JSON.stringify(views));
    const sessionStart = Date.now();
    const trackExit = () => {
      const duration = Math.round((Date.now() - sessionStart) / 1000);
      const sessions = JSON.parse(localStorage.getItem("rr_sessions") || "[]");
      sessions.push({ duration, exitPage: "app", timestamp: new Date().toISOString() });
      localStorage.setItem("rr_sessions", JSON.stringify(sessions));
    };
    window.addEventListener("beforeunload", trackExit);
    return () => window.removeEventListener("beforeunload", trackExit);
  }, []);

  const PROTECTED_SHELVES = ["Currently Reading", "Finished", "Recommended"];
  const DEFAULT_SHELVES = { "Want to Read":[], "Currently Reading":[], "Finished":[], "Recommended":[], "Kid #1 Reading List":[], "Books to Buy My Best Friend":[] };

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("Popular");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [contentRatings, setContentRatings] = useState([]);
  const [seriesStatus, setSeriesStatus] = useState("Any");
  const [language, setLanguage] = useState("");
  const [minPages, setMinPages] = useState("");
  const [maxPages, setMaxPages] = useState("");
  const [minWords, setMinWords] = useState("");
  const [maxWords, setMaxWords] = useState("");
  const [includeWarnings, setIncludeWarnings] = useState([]);
  const [includeTropes, setIncludeTropes] = useState([]);
  const [includeTags, setIncludeTags] = useState([]);
  const [excludeWarnings, setExcludeWarnings] = useState([]);
  const [excludeTropes, setExcludeTropes] = useState([]);
  const [excludeTags, setExcludeTags] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showBarcodeScan, setShowBarcodeScan] = useState(false);
  const [shelves, setShelves] = useState(DEFAULT_SHELVES);
  const [shelvesLoaded, setShelvesLoaded] = useState(false);
  const [showShelfPicker, setShowShelfPicker] = useState(null);
  const [activeShelf, setActiveShelf] = useState(null);
  const [guestPrompt, setGuestPrompt] = useState(null);
  const [showFriends, setShowFriends] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [friendSearch, setFriendSearch] = useState("");
  const [recNote, setRecNote] = useState("");
  const [showRecPanel, setShowRecPanel] = useState(false);

  // Account & username
  const [showAccount, setShowAccount] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  // Custom shelves
  const [newShelfName, setNewShelfName] = useState("");
  const [showNewShelfInput, setShowNewShelfInput] = useState(false);
  // Invite link copied
  const [inviteCopied, setInviteCopied] = useState(false);

  // Helper: check if user is authenticated, if not show guest prompt
  const requireAuth = (message) => {
    if (!isAuthenticated) { setGuestPrompt(message); return false; }
    return true;
  };

  // Load shelves from Supabase (only for authenticated users)
  useEffect(() => {
    if (!isAuthenticated) { setShelvesLoaded(true); return; }
    const loadShelves = async () => {
      const { data, error } = await supabase
        .from("user_shelves")
        .select("shelf_name, book_ids")
        .eq("user_id", user.id);
      if (!error && data && data.length > 0) {
        const loaded = { ...DEFAULT_SHELVES };
        data.forEach(row => { loaded[row.shelf_name] = row.book_ids || []; });
        setShelves(loaded);
      }
      setShelvesLoaded(true);
    };
    loadShelves();
  }, [user, isAuthenticated]);

  // Save shelves to Supabase
  useEffect(() => {
    if (!isAuthenticated || !shelvesLoaded) return;
    const saveShelves = async () => {
      for (const [name, bookIds] of Object.entries(shelves)) {
        const { data: existing } = await supabase
          .from("user_shelves").select("id").eq("user_id", user.id).eq("shelf_name", name).maybeSingle();
        if (existing) await supabase.from("user_shelves").update({ book_ids: bookIds, updated_at: new Date().toISOString() }).eq("id", existing.id);
        else await supabase.from("user_shelves").insert({ user_id: user.id, shelf_name: name, book_ids: bookIds });
      }
    };
    saveShelves();
  }, [shelves, user, isAuthenticated, shelvesLoaded]);

  // Load friends & recommendations + username
  useEffect(() => {
    if (!isAuthenticated) return;
    const loadSocial = async () => {
      // Load username
      const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
      if (profile?.username) { setUsername(profile.username); setUsernameInput(profile.username); }
      // Friends
      const { data: f } = await supabase.from("friendships")
        .select("*, requester:profiles!friendships_requester_id_fkey(id,email,display_name,username), addressee:profiles!friendships_addressee_id_fkey(id,email,display_name,username)")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      if (f) {
        setFriends(f.filter(x => x.status === "accepted"));
        setFriendRequests(f.filter(x => x.status === "pending" && x.addressee_id === user.id));
      }
      // Recommendations to me
      const { data: r } = await supabase.from("recommendations")
        .select("*, from_user:profiles!recommendations_from_user_id_fkey(id,email,display_name,username)")
        .eq("to_user_id", user.id);
      if (r) {
        setRecommendations(r);
        // Auto-populate Recommended shelf
        const recBookIds = [...new Set(r.map(rec => rec.book_id))];
        setShelves(prev => ({ ...prev, "Recommended": recBookIds }));
      }
    };
    loadSocial();
  }, [user, isAuthenticated]);

  // Save username
  const saveUsername = async () => {
    const trimmed = usernameInput.trim().toLowerCase();
    if (!trimmed) { setUsernameError("Username can't be empty."); return; }
    if (trimmed.length < 3) { setUsernameError("Must be at least 3 characters."); return; }
    if (!/^[a-z0-9_]+$/.test(trimmed)) { setUsernameError("Only lowercase letters, numbers, and underscores."); return; }
    const { data: existing } = await supabase.from("profiles").select("id").eq("username", trimmed).maybeSingle();
    if (existing && existing.id !== user.id) { setUsernameError("That username is already taken."); return; }
    const { error } = await supabase.from("profiles").update({ username: trimmed }).eq("id", user.id);
    if (error) { setUsernameError("Failed to save. Try again."); return; }
    setUsername(trimmed);
    setUsernameError("");
    setUsernameSaved(true);
    setTimeout(() => setUsernameSaved(false), 2000);
  };

  // Change password
  const changePassword = async () => {
    if (newPassword.length < 6) { setPasswordMsg("Min 6 characters."); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setPasswordMsg(error.message); return; }
    setPasswordMsg("Password updated!");
    setNewPassword("");
    setTimeout(() => setPasswordMsg(""), 3000);
  };

  // Create custom shelf
  const createShelf = () => {
    const name = newShelfName.trim();
    if (!name) return;
    if (shelves[name] !== undefined) { alert("A shelf with that name already exists."); return; }
    setShelves(prev => ({ ...prev, [name]: [] }));
    setNewShelfName("");
    setShowNewShelfInput(false);
  };

  // Delete shelf
  const deleteShelf = async (name) => {
    if (PROTECTED_SHELVES.includes(name)) return;
    if (!window.confirm(`Delete "${name}" shelf? Books won't be removed from your library.`)) return;
    setShelves(prev => { const u = { ...prev }; delete u[name]; return u; });
    if (activeShelf === name) setActiveShelf(null);
    // Also delete from Supabase
    if (isAuthenticated) {
      await supabase.from("user_shelves").delete().eq("user_id", user.id).eq("shelf_name", name);
    }
  };

  // Copy invite link
  const copyInviteLink = async () => {
    try { await navigator.clipboard.writeText(window.location.origin); setInviteCopied(true); setTimeout(() => setInviteCopied(false), 2000); }
    catch { alert("Link: " + window.location.origin); }
  };

  const sendFriendRequest = async () => {
    if (!friendSearch.trim()) return;
    const searchTerm = friendSearch.trim().toLowerCase();
    const { data: target } = await supabase.from("profiles").select("id,username").eq("username", searchTerm).maybeSingle();
    if (!target) { alert("No user found with that username. Make sure they've signed up and set a username."); return; }
    if (target.id === user.id) { alert("That's you!"); return; }
    const { data: ex } = await supabase.from("friendships").select("id").or(`and(requester_id.eq.${user.id},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${user.id})`).maybeSingle();
    if (ex) { alert("Friend request already exists or you're already friends."); return; }
    await supabase.from("friendships").insert({ requester_id: user.id, addressee_id: target.id });
    setFriendSearch("");
    alert("Friend request sent!");
  };

  const acceptFriend = async (id) => {
    await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
    setFriendRequests(p => p.filter(r => r.id !== id));
  };

  const recommendBook = async (bookId, friendId) => {
    if (!recNote && !window.confirm("Send recommendation without a note?")) return;
    await supabase.from("recommendations").insert({ from_user_id: user.id, to_user_id: friendId, book_id: bookId, note: recNote });
    setRecNote("");
    alert("Recommendation sent!");
  };

  // Get recommendations for a specific book (how many friends recommended it)
  const getBookRecs = (bookId) => recommendations.filter(r => r.book_id === bookId);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleBookClick = useCallback((book) => {
    setSelectedBook(book);
    trackEvent("book_click", { bookId: book.id, title: book.title });
    if (user?.email !== OWNER_EMAIL) trackGA("book_click", { bookId: book.id, title: book.title });
  }, [user]);

  const filteredBooks = useMemo(() => {
    let books = [...BOOKS_DB];
    if (search.trim()) { const q = search.toLowerCase(); books = books.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)); }
    if (selectedGenres.length) books = books.filter(b => selectedGenres.some(g => b.genres.includes(g)));
    if (contentRatings.length) books = books.filter(b => contentRatings.includes(b.contentRating));
    if (seriesStatus !== "Any") {
      if (seriesStatus === "Completed") books = books.filter(b => b.series?.status === "Completed");
      else if (seriesStatus === "Ongoing") books = books.filter(b => b.series?.status === "Ongoing");
      else if (seriesStatus === "Standalone") books = books.filter(b => !b.series);
    }
    if (language) books = books.filter(b => b.language === language);
    if (minPages) books = books.filter(b => b.pages >= +minPages);
    if (maxPages) books = books.filter(b => b.pages <= +maxPages);
    if (minWords) books = books.filter(b => b.words >= +minWords);
    if (maxWords) books = books.filter(b => b.words <= +maxWords);
    if (includeWarnings.length) books = books.filter(b => includeWarnings.some(w => b.warnings.includes(w)));
    if (includeTropes.length) books = books.filter(b => includeTropes.some(t => b.tropes.includes(t)));
    if (includeTags.length) books = books.filter(b => includeTags.some(t => b.tags.includes(t)));
    if (excludeWarnings.length) books = books.filter(b => !excludeWarnings.some(w => b.warnings.includes(w)));
    if (excludeTropes.length) books = books.filter(b => !excludeTropes.some(t => b.tropes.includes(t)));
    if (excludeTags.length) books = books.filter(b => !excludeTags.some(t => b.tags.includes(t)));
    if (sortBy === "Popular") books.sort((a, b) => b.rating - a.rating);
    else if (sortBy === "New") books.sort((a, b) => b.id - a.id);
    else if (sortBy === "Title") books.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === "Author") books.sort((a, b) => a.author.localeCompare(b.author));
    return books;
  }, [search, sortBy, selectedGenres, contentRatings, seriesStatus, language, minPages, maxPages, minWords, maxWords, includeWarnings, includeTropes, includeTags, excludeWarnings, excludeTropes, excludeTags]);

  const clearAllFilters = () => {
    setSortBy("Popular"); setSelectedGenres([]); setContentRatings([]);
    setSeriesStatus("Any"); setLanguage(""); setMinPages(""); setMaxPages("");
    setMinWords(""); setMaxWords(""); setIncludeWarnings([]); setIncludeTropes([]);
    setIncludeTags([]); setExcludeWarnings([]); setExcludeTropes([]); setExcludeTags([]);
  };

  const addToShelf = (bookId, shelfName) => {
    setShelves(prev => {
      const u = { ...prev };
      Object.keys(u).forEach(k => { u[k] = u[k].filter(id => id !== bookId); });
      u[shelfName] = [...u[shelfName], bookId];
      return u;
    });
    setShowShelfPicker(null);
  };

  const getBookShelf = (bookId) => {
    for (const [name, ids] of Object.entries(shelves)) { if (ids.includes(bookId)) return name; }
    return null;
  };

  // Helper to track filter usage — skips if the current user is the owner
  const trackFilter = (filterName, value) => {
    if (user?.email === OWNER_EMAIL) return; // don't track your own usage
    trackGA("filter_used", { filter: filterName, value: String(value) });
  };

  // ─── Filters Sidebar Content (Include/Exclude first, then Genre/etc) ───
  const FiltersContent = ({ isMobile = false }) => (
    <div style={{ padding: isMobile ? "20px" : 0 }}>
      {isMobile && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: C.cream, margin: 0 }}>Filters</h2>
          <button onClick={() => setShowMobileFilters(false)} style={{ background: "none", border: "none", color: C.cream, fontSize: "24px", cursor: "pointer" }}>✕</button>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        {!isMobile && <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", color: C.cream, fontWeight: 700 }}>FILTERS</span>}
        <span onClick={clearAllFilters} style={{ fontSize: "12px", color: C.teal, cursor: "pointer", fontWeight: 600 }}>Clear All</span>
      </div>
      <CollapsibleSection title="Include" color={C.teal} defaultOpen>
        <MultiSelect label="Warnings" options={ALL_WARNINGS} selected={includeWarnings} onChange={v => { setIncludeWarnings(v); trackFilter("includeWarnings", v); }} placeholder="Include warnings..." />
        <MultiSelect label="Tropes" options={ALL_TROPES} selected={includeTropes} onChange={v => { setIncludeTropes(v); trackFilter("includeTropes", v); }} placeholder="Include tropes..." />
        <MultiSelect label="Tags" options={ALL_TAGS} selected={includeTags} onChange={v => { setIncludeTags(v); trackFilter("includeTags", v); }} placeholder="Include tags..." />
      </CollapsibleSection>
      <CollapsibleSection title="Exclude" color="#8B3A3A" defaultOpen>
        <MultiSelect label="Warnings" options={ALL_WARNINGS} selected={excludeWarnings} onChange={v => { setExcludeWarnings(v); trackFilter("excludeWarnings", v); }} placeholder="Exclude warnings..." />
        <MultiSelect label="Tropes" options={ALL_TROPES} selected={excludeTropes} onChange={v => { setExcludeTropes(v); trackFilter("excludeTropes", v); }} placeholder="Exclude tropes..." />
        <MultiSelect label="Tags" options={ALL_TAGS} selected={excludeTags} onChange={v => { setExcludeTags(v); trackFilter("excludeTags", v); }} placeholder="Exclude tags..." />
      </CollapsibleSection>
      <CollapsibleSection title="Genre" defaultOpen><MultiSelect options={ALL_GENRES} selected={selectedGenres} onChange={v => { setSelectedGenres(v); trackFilter("genre", v); }} placeholder="Select genres..." /></CollapsibleSection>
      <CollapsibleSection title="Content Rating" defaultOpen>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {CONTENT_RATINGS.map(r => (
            <label key={r} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: C.cream }}>
              <input type="checkbox" checked={contentRatings.includes(r)} onChange={() => { setContentRatings(p => p.includes(r) ? p.filter(x => x !== r) : [...p, r]); trackFilter("contentRating", r); }} style={{ accentColor: C.copper }} />{r}
            </label>
          ))}
        </div>
      </CollapsibleSection>
      <CollapsibleSection title="Sort By" defaultOpen><Dropdown value={sortBy} onChange={v => { setSortBy(v); trackFilter("sortBy", v); }} options={["New", "Popular", "Title", "Author"]} /></CollapsibleSection>
      <CollapsibleSection title="More Options" color={C.teal}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: C.copper, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>SERIES STATUS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "12px" }}>
          {["Completed", "Ongoing", "Standalone", "Any"].map(s => (
            <label key={s} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: C.cream }}>
              <input type="radio" name="series" checked={seriesStatus === s} onChange={() => { setSeriesStatus(s); trackFilter("seriesStatus", s); }} style={{ accentColor: C.copper }} />{s}
            </label>
          ))}
        </div>
        <div style={{ fontSize: "11px", fontWeight: 700, color: C.copper, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>PAGE COUNT</div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
          <input type="number" placeholder="Min" value={minPages} onChange={e => setMinPages(e.target.value)} style={{ width: "70px", background: "rgba(43,30,47,0.6)", border: "1px solid rgba(194,122,58,0.3)", borderRadius: "6px", padding: "6px 8px", color: C.cream, fontSize: "12px" }} />
          <span style={{ color: C.cream }}>-</span>
          <input type="number" placeholder="Max" value={maxPages} onChange={e => setMaxPages(e.target.value)} style={{ width: "70px", background: "rgba(43,30,47,0.6)", border: "1px solid rgba(194,122,58,0.3)", borderRadius: "6px", padding: "6px 8px", color: C.cream, fontSize: "12px" }} />
        </div>
        <div style={{ fontSize: "11px", fontWeight: 700, color: C.copper, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>WORD COUNT</div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
          <input type="number" placeholder="Min" value={minWords} onChange={e => setMinWords(e.target.value)} style={{ width: "70px", background: "rgba(43,30,47,0.6)", border: "1px solid rgba(194,122,58,0.3)", borderRadius: "6px", padding: "6px 8px", color: C.cream, fontSize: "12px" }} />
          <span style={{ color: C.cream }}>-</span>
          <input type="number" placeholder="Max" value={maxWords} onChange={e => setMaxWords(e.target.value)} style={{ width: "70px", background: "rgba(43,30,47,0.6)", border: "1px solid rgba(194,122,58,0.3)", borderRadius: "6px", padding: "6px 8px", color: C.cream, fontSize: "12px" }} />
        </div>
        <Dropdown label="Language" value={language} onChange={v => { setLanguage(v); trackFilter("language", v); }} options={ALL_LANGUAGES} placeholder="Any Language" />
      </CollapsibleSection>
      {isMobile && <button onClick={() => setShowMobileFilters(false)} style={{ width: "100%", padding: "14px", background: C.teal, color: "#fff", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 700, cursor: "pointer", marginTop: "12px" }}>Apply Filters</button>}
    </div>
  );

  // ─── Book Detail Modal ───
  const BookDetailModal = ({ book, onClose }) => {
    const shelf = getBookShelf(book.id);
    return (
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div onClick={e => e.stopPropagation()} style={{ background: "linear-gradient(160deg, #2B1E2F 0%, #1a1220 100%)", borderRadius: "16px", maxWidth: "680px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "32px", position: "relative", border: "1px solid rgba(194,122,58,0.2)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
          <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", color: C.cream, fontSize: "24px", cursor: "pointer" }}>✕</button>
          <div style={{ display: "flex", gap: "20px", marginBottom: "24px", flexWrap: "wrap" }}>
            <div style={{ width: "130px", height: "195px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}><BookCover book={book} /></div>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", color: C.cream, margin: "0 0 4px", fontSize: "22px" }}>{book.title}</h2>
              <div style={{ color: "rgba(232,220,203,0.7)", fontSize: "14px", marginBottom: "8px" }}>by {book.author}</div>
              <StarRating rating={book.rating} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "12px 0" }}>
                {book.genres.map(g => <Badge key={g} text={g} color="#fff" bg={C.teal} border="none" />)}
                <Badge text={book.contentRating} color="#fff" bg={book.contentRating === "Adult" ? "#8B3A3A" : book.contentRating === "Teen" ? C.copper : C.teal} border="none" />
              </div>
              <div style={{ fontSize: "12px", color: "rgba(232,220,203,0.6)", display: "flex", flexWrap: "wrap", gap: "12px" }}>
                <span>{book.pages} pages</span><span>{book.words?.toLocaleString()} words</span><span>{book.language}</span>
                {book.series ? <span>{book.series.name} #{book.series.number} — {book.series.status.toLowerCase()}</span> : <span>Standalone</span>}
              </div>
              {(
                <div style={{ marginTop: "12px", position: "relative", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button onClick={() => { if (requireAuth("Save books to your personal shelves! Create a free account to start organizing your reading list.")) setShowShelfPicker(showShelfPicker === book.id ? null : book.id); }} style={{ padding: "8px 16px", background: shelf ? C.teal : "rgba(194,122,58,0.2)", border: `1px solid ${shelf ? C.teal : C.copper}`, borderRadius: "6px", color: shelf ? "#fff" : C.copper, fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                    {shelf ? `📚 ${shelf}` : "＋ Add to Shelf"}
                  </button>
                  {isAuthenticated && friends.length > 0 && (
                    <button onClick={() => setShowRecPanel(showRecPanel ? false : book.id)} style={{ padding: "8px 16px", background: "rgba(53,96,90,0.15)", border: `1px solid ${C.teal}`, borderRadius: "6px", color: C.teal, fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                      📤 Recommend
                    </button>
                  )}
                  {book.isbn && (
                    <>
                      <a href={`https://bookshop.org/a/123043/${book.isbn}`} target="_blank" rel="noreferrer" onClick={() => trackEvent("affiliate_click", { store: "bookshop", bookId: book.id, title: book.title })} style={{ padding: "8px 16px", background: "rgba(91,108,93,0.2)", border: `1px solid ${C.sage}`, borderRadius: "6px", color: C.sage, fontSize: "12px", fontWeight: 600, textDecoration: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        🛒 Bookshop.org
                      </a>
                      <a href={`https://www.amazon.com/s?k=${book.isbn}&tag=readersreal0e-20`} target="_blank" rel="noreferrer" onClick={() => trackEvent("affiliate_click", { store: "amazon", bookId: book.id, title: book.title })} style={{ padding: "8px 16px", background: "rgba(232,220,203,0.06)", border: "1px solid rgba(232,220,203,0.15)", borderRadius: "6px", color: "rgba(232,220,203,0.6)", fontSize: "12px", fontWeight: 600, textDecoration: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        🛍️ Amazon
                      </a>
                    </>
                  )}
                  {book.isbn && (
                    <div style={{ width: "100%", marginTop: "4px" }}>
                      <span style={{ fontSize: "9px", color: "rgba(232,220,203,0.3)", fontStyle: "italic" }}>As an affiliate, we earn a small commission from qualifying purchases at no extra cost to you.</span>
                    </div>
                  )}
                  {showShelfPicker === book.id && isAuthenticated && (
                    <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 10, marginTop: "4px", background: "#2B1E2F", border: "1px solid rgba(194,122,58,0.3)", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)", overflow: "hidden" }}>
                      {Object.keys(shelves).map(s => (
                        <div key={s} onClick={() => addToShelf(book.id, s)} style={{ padding: "10px 16px", cursor: "pointer", fontSize: "13px", color: shelves[s].includes(book.id) ? C.copper : C.cream, background: shelves[s].includes(book.id) ? "rgba(194,122,58,0.15)" : "transparent", whiteSpace: "nowrap" }}>{shelves[s].includes(book.id) ? "✓ " : ""}{s}</div>
                      ))}
                    </div>
                  )}
                  {showRecPanel === book.id && (
                    <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 10, marginTop: "4px", background: "#2B1E2F", border: "1px solid rgba(53,96,90,0.3)", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)", padding: "12px", minWidth: "240px" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: C.teal, marginBottom: "8px" }}>Send to a friend:</div>
                      <input placeholder="Add a note (optional)..." value={recNote} onChange={e=>setRecNote(e.target.value)} style={{ width: "100%", padding: "8px 10px", background: "rgba(43,30,47,0.6)", border: "1px solid rgba(53,96,90,0.3)", borderRadius: "6px", color: C.cream, fontSize: "12px", marginBottom: "8px" }} />
                      {friends.map(f => {
                        const friend = f.requester_id === user.id ? f.addressee : f.requester;
                        return (
                          <div key={f.id} onClick={() => { recommendBook(book.id, friend.id); setShowRecPanel(false); }} style={{ padding: "8px 10px", cursor: "pointer", fontSize: "12px", color: C.cream, borderRadius: "6px", marginBottom: "2px" }} onMouseOver={e=>e.target.style.background="rgba(53,96,90,0.2)"} onMouseOut={e=>e.target.style.background="transparent"}>
                            👤 {friend?.username ? `@${friend.username}` : friend?.display_name || friend?.email?.split("@")[0]}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Recommended by tags */}
                  {isAuthenticated && getBookRecs(book.id).length > 0 && (
                    <div style={{ width: "100%", marginTop: "6px" }}>
                      <div style={{ fontSize: "10px", color: C.teal, fontWeight: 600, marginBottom: "4px" }}>Recommended by:</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {getBookRecs(book.id).map((r, i) => (
                          <span key={i} style={{ padding: "2px 8px", background: "rgba(53,96,90,0.15)", border: "1px solid rgba(53,96,90,0.3)", borderRadius: "10px", fontSize: "10px", color: C.teal }}>{r.from_user?.username ? `@${r.from_user.username}` : r.from_user?.display_name || "Friend"}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", color: C.copper, fontSize: "14px", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>DESCRIPTION</h3>
            <p style={{ color: C.cream, fontSize: "14px", lineHeight: 1.7, margin: 0 }}>{book.description}</p>
          </div>
          {book.warnings.length > 0 && (
            <div style={{ background: "rgba(139,58,58,0.1)", border: "1px solid rgba(139,58,58,0.3)", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "13px", color: "#C27A3A", letterSpacing: "1px", margin: "0 0 12px", display: "flex", alignItems: "center", gap: "6px" }}>⚠ CONTENT WARNINGS</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>{book.warnings.map(w => <Badge key={w} text={w} color="#C27A3A" border="1px solid rgba(194,122,58,0.4)" />)}</div>
            </div>
          )}
          {book.tropes.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: C.copper, fontSize: "13px", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>TROPES</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>{book.tropes.map(t => <Badge key={t} text={t} color={C.cream} border="1px solid rgba(232,220,203,0.3)" />)}</div>
            </div>
          )}
          {book.tags.length > 0 && (
            <div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: C.copper, fontSize: "13px", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>TAGS</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>{book.tags.map(t => <Badge key={t} text={t} color={C.teal} border="1px solid rgba(53,96,90,0.5)" />)}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (authLoading || (!user && !isGuest)) return (
    <div style={{ background:"#1a1220",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:C.cream,fontFamily:"'Source Sans 3',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:"32px",marginBottom:"12px" }}>📖</div>
        <div style={{ color:"rgba(232,220,203,0.5)",fontSize:"14px" }}>Loading your library...</div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Source Sans 3', 'Segoe UI', sans-serif", background: "linear-gradient(180deg, #1a1220 0%, #2B1E2F 100%)", minHeight: "100vh", color: C.cream }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(194,122,58,0.3); border-radius: 3px; }
        ::placeholder { color: rgba(232,220,203,0.4); }
        input, select { outline: none; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @media (max-width: 768px) {
          .desktop-filters { display: none !important; }
          .mobile-filter-btn { display: flex !important; }
          .book-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important; }
          .main-content { margin-left: 0 !important; }
          .hero-title { font-size: 28px !important; }
          .nav-label { display: none; }
        }
        @media (min-width: 769px) {
          .mobile-filter-btn { display: none !important; }
          .mobile-filter-overlay { display: none !important; }
        }
      `}</style>

      {/* Guest Prompt */}
      {guestPrompt && <GuestPrompt message={guestPrompt} onClose={() => setGuestPrompt(null)} />}

      {/* Friends & Recommendations Panel */}
      {showFriends && isAuthenticated && (
        <div onClick={() => setShowFriends(false)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(6px)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px" }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"linear-gradient(160deg,#2B1E2F,#1a1220)",borderRadius:"18px",maxWidth:"550px",width:"100%",maxHeight:"85vh",overflowY:"auto",padding:"28px",border:"1px solid rgba(194,122,58,0.2)" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px" }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif",color:C.cream,margin:0,fontSize:"20px" }}>Friends & Recommendations</h2>
              <button onClick={()=>setShowFriends(false)} style={{ background:"none",border:"none",color:C.cream,fontSize:"20px",cursor:"pointer" }}>✕</button>
            </div>

            {/* Add Friend */}
            <div style={{ marginBottom:"20px",padding:"16px",background:"rgba(232,220,203,0.03)",borderRadius:"12px",border:"1px solid rgba(232,220,203,0.08)" }}>
              <div style={{ fontSize:"11px",fontWeight:700,color:C.copper,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"10px" }}>Add a Friend by Username</div>
              <div style={{ display:"flex",gap:"8px" }}>
                <input type="text" placeholder="Enter their username..." value={friendSearch} onChange={e=>setFriendSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendFriendRequest()}
                  style={{ flex:1,padding:"10px 14px",background:"rgba(43,30,47,0.6)",border:"1px solid rgba(194,122,58,0.25)",borderRadius:"8px",color:C.cream,fontSize:"13px" }} />
                <button onClick={sendFriendRequest} style={{ padding:"10px 16px",background:`linear-gradient(135deg,${C.copper},#A86830)`,border:"none",borderRadius:"8px",color:"#fff",fontSize:"12px",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap" }}>Send Request</button>
              </div>
            </div>

            {/* Invite a Friend to Join */}
            <div style={{ marginBottom:"20px",padding:"16px",background:"rgba(53,96,90,0.08)",borderRadius:"12px",border:"1px solid rgba(53,96,90,0.2)" }}>
              <div style={{ fontSize:"11px",fontWeight:700,color:C.teal,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"6px" }}>Invite a Friend to Join</div>
              <p style={{ fontSize:"12px",color:"rgba(232,220,203,0.5)",margin:"0 0 10px",lineHeight:1.5 }}>Know someone who'd love Readers' Realm? Send them an invite link!</p>
              <button onClick={() => {
                const link = window.location.origin;
                const text = `Join me on Readers' Realm — a cozy book community where we track reads, share recommendations, and read by the campfire together! 📚🔥\n\n${link}`;
                if (navigator.share) {
                  navigator.share({ title: "Join Readers' Realm", text, url: link }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(text).then(() => {
                    alert("Invite link copied to clipboard! 📋 Share it with your friends.");
                  }).catch(() => {
                    prompt("Copy this invite link:", text);
                  });
                }
              }} style={{ width:"100%",padding:"11px 16px",background:"rgba(53,96,90,0.2)",border:"1px solid rgba(53,96,90,0.35)",borderRadius:"8px",color:C.teal,fontSize:"13px",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",transition:"all 0.2s" }}
              onMouseOver={e=>e.currentTarget.style.background="rgba(53,96,90,0.3)"}
              onMouseOut={e=>e.currentTarget.style.background="rgba(53,96,90,0.2)"}>
                📨 Send Invite Link
              </button>
            </div>

            {/* Friend Requests */}
            {friendRequests.length > 0 && (
              <div style={{ marginBottom:"20px" }}>
                <div style={{ fontSize:"11px",fontWeight:700,color:C.teal,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"10px" }}>Pending Requests</div>
                {friendRequests.map(r => (
                  <div key={r.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:"rgba(53,96,90,0.1)",borderRadius:"8px",marginBottom:"6px" }}>
                    <span style={{ color:C.cream,fontSize:"13px" }}>{r.requester?.username ? `@${r.requester.username}` : r.requester?.display_name || r.requester?.email}</span>
                    <button onClick={()=>acceptFriend(r.id)} style={{ padding:"6px 14px",background:C.teal,border:"none",borderRadius:"6px",color:"#fff",fontSize:"11px",fontWeight:700,cursor:"pointer" }}>Accept</button>
                  </div>
                ))}
              </div>
            )}

            {/* Friends List */}
            <div style={{ marginBottom:"20px" }}>
              <div style={{ fontSize:"11px",fontWeight:700,color:C.copper,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"10px" }}>
                My Friends ({friends.length})
              </div>
              {friends.length === 0 ? (
                <p style={{ color:"rgba(232,220,203,0.4)",fontSize:"13px" }}>No friends yet. Send a request above!</p>
              ) : friends.map(f => {
                const friend = f.requester_id === user.id ? f.addressee : f.requester;
                return (
                  <div key={f.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:"rgba(232,220,203,0.03)",borderRadius:"8px",marginBottom:"6px",border:"1px solid rgba(232,220,203,0.06)" }}>
                    <span style={{ color:C.cream,fontSize:"13px" }}>👤 {friend?.username ? `@${friend.username}` : friend?.display_name || friend?.email?.split("@")[0]}</span>
                    <span style={{ color:"rgba(232,220,203,0.4)",fontSize:"11px" }}>Friends</span>
                  </div>
                );
              })}
            </div>

            {/* Recommendations Received */}
            <div>
              <div style={{ fontSize:"11px",fontWeight:700,color:C.copper,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"10px" }}>
                📚 Books Recommended to You ({recommendations.length})
              </div>
              {recommendations.length === 0 ? (
                <p style={{ color:"rgba(232,220,203,0.4)",fontSize:"13px" }}>No recommendations yet. Your friends can recommend books to you!</p>
              ) : (() => {
                // Group by book_id, show count + who recommended
                const grouped = {};
                recommendations.forEach(r => {
                  if (!grouped[r.book_id]) grouped[r.book_id] = { recs: [], bookId: r.book_id };
                  grouped[r.book_id].recs.push(r);
                });
                const sorted = Object.values(grouped).sort((a, b) => b.recs.length - a.recs.length);
                return sorted.map(g => {
                  const book = BOOKS_DB.find(b => b.id === g.bookId);
                  if (!book) return null;
                  return (
                    <div key={g.bookId} onClick={() => { setSelectedBook(book); setShowFriends(false); }} style={{ padding:"12px 14px",background:"rgba(232,220,203,0.03)",borderRadius:"10px",marginBottom:"8px",border:"1px solid rgba(232,220,203,0.06)",cursor:"pointer" }}>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px" }}>
                        <span style={{ color:C.cream,fontSize:"14px",fontWeight:600 }}>{book.title}</span>
                        {g.recs.length > 1 && <span style={{ padding:"2px 8px",background:"rgba(194,122,58,0.2)",borderRadius:"10px",fontSize:"10px",color:C.copper,fontWeight:700 }}>🔥 {g.recs.length} friends</span>}
                      </div>
                      <div style={{ color:"rgba(232,220,203,0.5)",fontSize:"12px" }}>by {book.author}</div>
                      {g.recs.map((r, i) => (
                        <div key={i} style={{ marginTop:"6px",padding:"6px 10px",background:"rgba(53,96,90,0.1)",borderRadius:"6px",fontSize:"11px" }}>
                          <span style={{ color:C.teal,fontWeight:600 }}>{r.from_user?.username ? `@${r.from_user.username}` : r.from_user?.display_name || "A friend"}</span>
                          {r.note && <span style={{ color:"rgba(232,220,203,0.6)",marginLeft:"6px" }}>"{r.note}"</span>}
                        </div>
                      ))}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAbout && (
        <div onClick={() => setShowAbout(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "linear-gradient(160deg, #2B1E2F 0%, #1a1220 100%)", borderRadius: "20px", maxWidth: "500px", width: "100%", padding: "36px", border: "1px solid rgba(194,122,58,0.3)" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: C.cream, marginBottom: "12px" }}>About Readers' Realm</h2>
            <p style={{ color: "rgba(232,220,203,0.8)", fontSize: "14px", lineHeight: 1.7 }}>Readers' Realm is a book discovery platform inspired by Archive of Our Own's tagging system — but for published books. Filter by tropes, content warnings, ratings, and more to find exactly what you're ready to read.</p>
            <p style={{ color: "rgba(232,220,203,0.8)", fontSize: "14px", lineHeight: 1.7, marginTop: "12px" }}>We believe every reader deserves to know what they're getting into before they start a book.</p>
            <button onClick={() => setShowAbout(false)} style={{ padding: "10px 24px", background: C.teal, color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer", marginTop: "16px" }}>Close</button>
          </div>
        </div>
      )}

      {selectedBook && <BookDetailModal book={selectedBook} onClose={() => { setSelectedBook(null); setShowShelfPicker(null); }} />}

      {/* Account Modal */}
      {showAccount && isAuthenticated && (
        <div onClick={() => setShowAccount(false)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(6px)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px" }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"linear-gradient(160deg,#2B1E2F,#1a1220)",borderRadius:"20px",maxWidth:"460px",width:"100%",maxHeight:"85vh",overflowY:"auto",padding:"32px",border:"1px solid rgba(194,122,58,0.3)" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"24px" }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif",color:C.cream,margin:0,fontSize:"22px" }}>My Account</h2>
              <button onClick={()=>setShowAccount(false)} style={{ background:"none",border:"none",color:C.cream,fontSize:"20px",cursor:"pointer" }}>✕</button>
            </div>

            {/* Email */}
            <div style={{ marginBottom:"20px",padding:"14px",background:"rgba(232,220,203,0.03)",borderRadius:"12px",border:"1px solid rgba(232,220,203,0.08)" }}>
              <div style={{ fontSize:"11px",fontWeight:700,color:C.copper,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"6px" }}>Email</div>
              <div style={{ color:C.cream,fontSize:"14px" }}>{user?.email}</div>
            </div>

            {/* Username */}
            <div style={{ marginBottom:"20px",padding:"14px",background:"rgba(232,220,203,0.03)",borderRadius:"12px",border:"1px solid rgba(232,220,203,0.08)" }}>
              <div style={{ fontSize:"11px",fontWeight:700,color:C.copper,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"8px" }}>Username</div>
              <div style={{ display:"flex",gap:"8px" }}>
                <input type="text" placeholder="Choose a username..." value={usernameInput} onChange={e=>setUsernameInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveUsername()}
                  style={{ flex:1,padding:"10px 14px",background:"rgba(43,30,47,0.6)",border:"1px solid rgba(194,122,58,0.25)",borderRadius:"8px",color:C.cream,fontSize:"13px" }} />
                <button onClick={saveUsername} style={{ padding:"10px 16px",background:usernameSaved?C.teal:`linear-gradient(135deg,${C.copper},#A86830)`,border:"none",borderRadius:"8px",color:"#fff",fontSize:"12px",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",minWidth:"70px" }}>
                  {usernameSaved ? "✓ Saved" : "Save"}
                </button>
              </div>
              {usernameError && <div style={{ color:"#C27A3A",fontSize:"12px",marginTop:"6px" }}>{usernameError}</div>}
              <div style={{ color:"rgba(232,220,203,0.35)",fontSize:"11px",marginTop:"6px" }}>Friends will find you by this username. Lowercase letters, numbers, and underscores only.</div>
            </div>

            {/* Change Password */}
            <div style={{ marginBottom:"20px",padding:"14px",background:"rgba(232,220,203,0.03)",borderRadius:"12px",border:"1px solid rgba(232,220,203,0.08)" }}>
              <div style={{ fontSize:"11px",fontWeight:700,color:C.copper,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"8px" }}>Change Password</div>
              {!showChangePassword ? (
                <button onClick={()=>setShowChangePassword(true)} style={{ padding:"8px 16px",background:"rgba(232,220,203,0.06)",border:"1px solid rgba(232,220,203,0.15)",borderRadius:"8px",color:C.cream,fontSize:"12px",fontWeight:600,cursor:"pointer" }}>Change Password</button>
              ) : (
                <div style={{ display:"flex",gap:"8px" }}>
                  <input type="password" placeholder="New password (min 6 chars)..." value={newPassword} onChange={e=>setNewPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&changePassword()}
                    style={{ flex:1,padding:"10px 14px",background:"rgba(43,30,47,0.6)",border:"1px solid rgba(194,122,58,0.25)",borderRadius:"8px",color:C.cream,fontSize:"13px" }} />
                  <button onClick={changePassword} style={{ padding:"10px 16px",background:`linear-gradient(135deg,${C.copper},#A86830)`,border:"none",borderRadius:"8px",color:"#fff",fontSize:"12px",fontWeight:700,cursor:"pointer" }}>Update</button>
                </div>
              )}
              {passwordMsg && <div style={{ color:passwordMsg.includes("updated")?C.teal:C.copper,fontSize:"12px",marginTop:"6px" }}>{passwordMsg}</div>}
            </div>

            {/* Coming Soon */}
            <div style={{ padding:"16px",background:"rgba(53,96,90,0.08)",borderRadius:"12px",border:"1px solid rgba(53,96,90,0.2)",textAlign:"center" }}>
              <div style={{ fontSize:"20px",marginBottom:"6px" }}>🚀</div>
              <div style={{ fontFamily:"'Playfair Display',serif",color:C.cream,fontSize:"15px",fontWeight:600,marginBottom:"4px" }}>More Features Coming Soon</div>
              <div style={{ color:"rgba(232,220,203,0.5)",fontSize:"12px",lineHeight:1.6 }}>Profile pictures, reading stats, book reviews, and more are on the way. Stay tuned!</div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Modal */}
      {showBarcodeScan && (
        <div onClick={() => setShowBarcodeScan(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "linear-gradient(160deg, #2B1E2F 0%, #1a1220 100%)", borderRadius: "20px", maxWidth: "400px", width: "100%", padding: "36px", textAlign: "center", border: "1px solid rgba(194,122,58,0.3)" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📷</div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", color: C.cream, marginBottom: "8px" }}>Barcode Scanner</h3>
            <p style={{ color: "rgba(232,220,203,0.7)", fontSize: "13px", lineHeight: 1.6, marginBottom: "20px" }}>Point your camera at the barcode on the back of a book to instantly look it up. This feature will be fully functional in the launched version.</p>
            <div style={{ width: "200px", height: "200px", border: "2px dashed rgba(194,122,58,0.4)", borderRadius: "12px", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
              <div style={{ color: "rgba(232,220,203,0.4)", fontSize: "13px" }}>Camera preview<br/>coming soon</div>
            </div>
            <button onClick={() => setShowBarcodeScan(false)} style={{ padding: "10px 24px", background: C.teal, color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Close</button>
          </div>
        </div>
      )}

      {/* Mobile Filters */}
      {showMobileFilters && (
        <div className="mobile-filter-overlay" style={{ position: "fixed", inset: 0, background: "linear-gradient(160deg, #2B1E2F 0%, #1a1220 100%)", zIndex: 1800, overflowY: "auto" }}>
          <FiltersContent isMobile />
        </div>
      )}

      {/* Navbar */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", background: "rgba(74,44,35,0.5)", borderBottom: "1px solid rgba(194,122,58,0.2)", flexWrap: "wrap", gap: "10px", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)" }}>
        <div onClick={() => setActiveShelf(null)} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", flexShrink: 0 }}>
          <span style={{ fontSize: "22px" }}>📖</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", color: C.copper, fontWeight: 700, fontStyle: "italic" }}>Readers' Realm</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", flex: 1, maxWidth: "520px", minWidth: "200px" }}>
          <div style={{ display: "flex", alignItems: "center", flex: 1, background: "rgba(232,220,203,0.08)", borderRadius: "8px 0 0 8px", padding: "0 14px", border: "1px solid rgba(194,122,58,0.2)", borderRight: "none" }}>
            <span style={{ color: "rgba(232,220,203,0.4)", marginRight: "8px" }}>🔍</span>
            <input type="text" placeholder="Search title or author..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: "transparent", border: "none", color: C.cream, fontSize: "14px", padding: "10px 0", width: "100%" }} />
          </div>
          <button onClick={() => { if (user?.email !== OWNER_EMAIL) trackGA("barcode_scanner_click"); setShowBarcodeScan(true); }} title="Scan barcode" style={{ padding: "10px 14px", background: "rgba(194,122,58,0.15)", border: "1px solid rgba(194,122,58,0.2)", borderRadius: "0 8px 8px 0", cursor: "pointer", color: C.copper, fontSize: "16px", display: "flex", alignItems: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="2" height="16"/><rect x="6" y="4" width="1" height="16"/><rect x="9" y="4" width="2" height="16"/><rect x="13" y="4" width="1" height="16"/><rect x="16" y="4" width="2" height="16"/><rect x="20" y="4" width="2" height="16"/></svg>
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, flexWrap: "wrap" }}>
          <Link to="/campfire" onClick={e => { if (user?.email !== OWNER_EMAIL) trackGA("campfire_nav_click"); if (!requireAuth("Join the Campfire to read alongside others. Create a free account to access this cozy feature!")) e.preventDefault(); }} style={{ padding: "8px 12px", background: "rgba(194,122,58,0.1)", border: "1px solid rgba(194,122,58,0.2)", borderRadius: "8px", color: C.copper, fontSize: "12px", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>🔥 <span className="nav-label">Campfire</span></Link>
          <button onClick={() => { if (user?.email !== OWNER_EMAIL) trackGA("friends_panel_click"); if (requireAuth("Add friends and share book recommendations. Create a free account to connect with other readers!")) setShowFriends(true); }} style={{ padding: "8px 12px", background: "rgba(194,122,58,0.2)", border: `1px solid ${C.copper}`, borderRadius: "8px", color: C.copper, fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>👥 <span className="nav-label">Friends</span>{friendRequests.length > 0 && <span style={{ background:C.copper,color:"#fff",borderRadius:"10px",padding:"1px 6px",fontSize:"10px",fontWeight:700,marginLeft:"2px" }}>{friendRequests.length}</span>}</button>
          {isAuthenticated ? (
            <>
              <button onClick={() => setShowAccount(true)} title="My Account" style={{ padding: "8px 10px", background: "rgba(194,122,58,0.2)", border: `1px solid ${C.copper}`, borderRadius: "8px", color: C.copper, fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>👤</button>
              <a href="https://forms.gle/C11bVEcooZQ9CrWx5" target="_blank" rel="noreferrer" onClick={() => trackEvent("feedback_click")} style={{ padding: "8px 10px", background: "rgba(194,122,58,0.2)", border: `1px solid ${C.copper}`, borderRadius: "8px", color: C.copper, fontSize: "11px", fontWeight: 600, textDecoration: "none", cursor: "pointer" }}>💬</a>
              <button onClick={() => { trackGA("signout_click"); handleSignOut(); }} style={{ padding: "8px 10px", background: "rgba(194,122,58,0.15)", border: `1px solid ${C.copper}`, borderRadius: "8px", color: C.copper, fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>Sign Out</button>
            </>
          ) : (
            <>
              <button onClick={() => { trackGA("signup_nav_click"); navigate("/"); }} style={{ padding: "8px 14px", background: `linear-gradient(135deg, ${C.copper}, #A86830)`, border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Sign Up</button>
              <button onClick={() => setShowAbout(true)} style={{ padding: "8px 10px", background: "rgba(232,220,203,0.08)", border: "1px solid rgba(232,220,203,0.15)", borderRadius: "8px", color: C.cream, fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>About</button>
            </>
          )}
        </div>
      </nav>

      {/* Mobile Filter Button */}
      <div className="mobile-filter-btn" style={{ display: "none", position: "sticky", top: "62px", zIndex: 90, padding: "8px 20px", background: "rgba(26,18,32,0.95)" }}>
        <button onClick={() => setShowMobileFilters(true)} style={{ width: "100%", padding: "12px", background: "rgba(194,122,58,0.15)", border: "1px solid rgba(194,122,58,0.3)", borderRadius: "8px", color: C.copper, fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
          Filters
        </button>
      </div>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "40px 20px 32px", background: "linear-gradient(180deg, rgba(74,44,35,0.3) 0%, transparent 100%)" }}>
        <div style={{ fontSize: "11px", letterSpacing: "4px", color: C.copper, fontWeight: 600, textTransform: "uppercase", marginBottom: "12px" }}>WHERE EVERY BOOK FINDS ITS READER</div>
        <h1 className="hero-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: "42px", fontWeight: 700, color: C.cream, marginBottom: "12px" }}>
          Discover Books on <span style={{ color: C.copper, fontStyle: "italic" }}>Your</span> Terms
        </h1>
        <p style={{ color: "rgba(232,220,203,0.6)", fontSize: "15px", maxWidth: "520px", margin: "0 auto" }}>
          Filter by tropes, content warnings, ratings, and more. Find exactly what you are ready to read.
        </p>
      </div>

      {/* Signed-in Shelves */}
      {isAuthenticated && !activeShelf && (
        <div style={{ padding: "0 24px 16px", overflowX: "auto" }}>
          <div style={{ display: "flex", gap: "8px", paddingBottom: "4px", alignItems: "center" }}>
            {Object.entries(shelves).map(([name, ids]) => (
              <button key={name} onClick={() => setActiveShelf(name)} style={{ padding: "8px 16px", background: "rgba(194,122,58,0.1)", border: "1px solid rgba(194,122,58,0.25)", borderRadius: "20px", color: C.copper, fontSize: "12px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px" }}>
                {name === "Recommended" ? "💌" : "📚"} {name} <span style={{ background: "rgba(194,122,58,0.25)", borderRadius: "8px", padding: "1px 6px", fontSize: "10px" }}>{ids.length}</span>
              </button>
            ))}
            {!showNewShelfInput ? (
              <button onClick={() => setShowNewShelfInput(true)} style={{ padding: "8px 14px", background: "rgba(53,96,90,0.15)", border: "1px dashed rgba(53,96,90,0.4)", borderRadius: "20px", color: C.teal, fontSize: "12px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>＋ New Shelf</button>
            ) : (
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <input type="text" placeholder="Shelf name..." value={newShelfName} onChange={e => setNewShelfName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") createShelf(); if (e.key === "Escape") setShowNewShelfInput(false); }} autoFocus
                  style={{ padding: "6px 12px", background: "rgba(43,30,47,0.6)", border: "1px solid rgba(53,96,90,0.4)", borderRadius: "8px", color: C.cream, fontSize: "12px", width: "140px" }} />
                <button onClick={createShelf} style={{ padding: "6px 10px", background: C.teal, border: "none", borderRadius: "8px", color: "#fff", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>Add</button>
                <button onClick={() => { setShowNewShelfInput(false); setNewShelfName(""); }} style={{ background: "none", border: "none", color: "rgba(232,220,203,0.5)", fontSize: "16px", cursor: "pointer" }}>✕</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Layout */}
      {activeShelf ? (
        <div style={{ padding: "0 24px 40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <button onClick={() => setActiveShelf(null)} style={{ background: "none", border: "none", color: C.copper, fontSize: "14px", cursor: "pointer" }}>← Back</button>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: C.cream, margin: 0, fontSize: "22px" }}>{activeShelf}</h2>
            {!PROTECTED_SHELVES.includes(activeShelf) && (
              <button onClick={() => deleteShelf(activeShelf)} style={{ marginLeft: "auto", padding: "6px 14px", background: "rgba(139,58,58,0.15)", border: "1px solid rgba(139,58,58,0.3)", borderRadius: "8px", color: "#C27A3A", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>🗑 Delete Shelf</button>
            )}
          </div>
          {shelves[activeShelf]?.length === 0 ? (
            activeShelf === "Recommended" ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>💌</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", color: C.cream, marginBottom: "8px" }}>No recommendations yet!</h3>
                <p style={{ color: "rgba(232,220,203,0.5)", fontSize: "14px", lineHeight: 1.6, maxWidth: "360px", margin: "0 auto 16px" }}>Invite friends to Readers' Realm so they can recommend books to you. The more friends you have, the better your recommendations get!</p>
                <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                  <button onClick={() => setShowFriends(true)} style={{ padding: "10px 20px", background: `linear-gradient(135deg, ${C.copper}, #A86830)`, color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>👥 Add Friends</button>
                  <button onClick={copyInviteLink} style={{ padding: "10px 20px", background: "rgba(194,122,58,0.15)", border: `1px solid ${C.copper}`, borderRadius: "8px", color: C.copper, fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>{inviteCopied ? "Link Copied!" : "Invite Friends"}</button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(232,220,203,0.5)" }}><div style={{ fontSize: "40px", marginBottom: "12px" }}>📚</div><p>No books yet. Browse and add some!</p></div>
            )
          ) : (
            <div className="book-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "24px" }}>
              {shelves[activeShelf].map(id => BOOKS_DB.find(b => b.id === id)).filter(Boolean).map(book => (
                <div key={book.id} onClick={() => handleBookClick(book)} style={{ cursor: "pointer" }}>
                  <div style={{ position: "relative", borderRadius: "10px", overflow: "hidden", aspectRatio: "2/3", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}><BookCover book={book} /><ContentBadge rating={book.contentRating} /></div>
                  <div style={{ marginTop: "8px" }}><div style={{ fontSize: "13px", fontWeight: 600, color: C.cream, lineHeight: 1.3 }}>{book.title}</div><div style={{ fontSize: "11px", color: "rgba(232,220,203,0.6)", marginTop: "2px" }}>{book.author}</div></div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", padding: "0 24px 40px", gap: "24px" }}>
          <div className="desktop-filters" style={{ width: "240px", flexShrink: 0, position: "sticky", top: "80px", maxHeight: "calc(100vh - 100px)", overflowY: "auto", paddingRight: "8px" }}>
            <FiltersContent />
          </div>
          <div className="main-content" style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "8px" }}>
              <div><span style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", color: C.copper, fontWeight: 700 }}>{filteredBooks.length}</span><span style={{ color: "rgba(232,220,203,0.6)", fontSize: "14px", marginLeft: "6px" }}>books found</span></div>
              <span style={{ color: "rgba(232,220,203,0.4)", fontSize: "12px" }}>Click any cover to see full details</span>
            </div>
            <div className="book-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "24px" }}>
              {filteredBooks.map(book => (
                <div key={book.id} onClick={() => handleBookClick(book)} style={{ cursor: "pointer", transition: "transform 0.2s", animation: "fadeIn 0.4s ease-out" }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-4px)"} onMouseOut={e => e.currentTarget.style.transform = "none"}>
                  <div style={{ position: "relative", borderRadius: "10px", overflow: "hidden", aspectRatio: "2/3", boxShadow: "0 4px 16px rgba(0,0,0,0.4)", border: "1px solid rgba(232,220,203,0.08)" }}>
                    <BookCover book={book} /><ContentBadge rating={book.contentRating} />
                  </div>
                  <div style={{ marginTop: "10px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: C.cream, lineHeight: 1.3 }}>{book.title}</div>
                    <div style={{ fontSize: "11px", color: "rgba(232,220,203,0.6)", marginTop: "2px" }}>{book.author}</div>
                    <div style={{ marginTop: "4px" }}><StarRating rating={book.rating} /></div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
                      {book.genres.slice(0, 3).map(g => (<span key={g} style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "4px", background: "rgba(232,220,203,0.08)", color: "rgba(232,220,203,0.6)", border: "1px solid rgba(232,220,203,0.1)" }}>{g}</span>))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredBooks.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📚</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", color: C.cream, marginBottom: "8px" }}>No books match your filters</h3>
                <p style={{ color: "rgba(232,220,203,0.5)", fontSize: "14px" }}>Try adjusting your filters or search query</p>
                <button onClick={clearAllFilters} style={{ marginTop: "16px", padding: "10px 24px", background: C.teal, color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Clear All Filters</button>
              </div>
            )}
          </div>
        </div>
      )}

      <footer style={{ textAlign: "center", padding: "24px", borderTop: "1px solid rgba(232,220,203,0.08)", color: "rgba(232,220,203,0.3)", fontSize: "12px" }}>
        <span style={{ fontFamily: "'Playfair Display', serif", color: "rgba(194,122,58,0.5)" }}>Readers' Realm</span> — Prototype Preview
      </footer>
    </div>
  );
}
