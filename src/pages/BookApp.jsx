import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase } from "../lib/supabase.js";
import GuestPrompt from "../components/GuestPrompt.jsx";

// Analytics are loaded natively in index.html (GTM + gtag)

// ─── Set your own email here so YOUR activity is never tracked ───
const OWNER_EMAIL = "YOUR_EMAIL_HERE"; // ← replace with your actual email address

// ─── Google Analytics Helper ───
const trackGA = (eventName, params = {}) => {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", eventName, { event_category: "BookApp", ...params });
  }
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

  // ─── Children's Books (201–250) ───
  { id:201, isbn:"9780061124952", title:"Charlotte's Web", author:"E.B. White", rating:4.9, genres:["Fiction","Children's","Classics"], contentRating:"All Ages", pages:184, words:32000, language:"English", series:null, description:"Wilbur the pig is scared of the end that awaits him. But his spider friend Charlotte hatches a remarkable plan to save him — by spinning words of praise into her web above his pen.", warnings:["Death","Animal Death","Grief"], tropes:["Unlikely Friendship","Sacrifice","Coming of Age","Bittersweet Ending"], tags:["Animals","Friendship","Emotional","Classic","Heartwarming","Farm"] },
  { id:202, isbn:"9780399226908", title:"The Very Hungry Caterpillar", author:"Eric Carle", rating:4.9, genres:["Children's","Picture Book"], contentRating:"All Ages", pages:26, words:200, language:"English", series:null, description:"A tiny caterpillar eats through a tremendous variety of food over the course of a week before spinning a cocoon and emerging as a beautiful butterfly.", warnings:[], tropes:["Transformation","Coming of Age"], tags:["Picture Book","Counting","Nature","Animals","Educational","Classic"] },
  { id:203, isbn:"9780064431781", title:"Where the Wild Things Are", author:"Maurice Sendak", rating:4.8, genres:["Children's","Picture Book","Fantasy"], contentRating:"All Ages", pages:48, words:340, language:"English", series:null, description:"Max is sent to bed without supper for causing mischief. That night a forest grows in his room and he sails to the land of the Wild Things, where he becomes king of all wild things.", warnings:["Mild Monster Imagery"], tropes:["Adventure","Imagination","Coming Home","Trickster"], tags:["Picture Book","Imagination","Monsters","Adventure","Classic","Bedtime"] },
  { id:204, isbn:"9780064430173", title:"Goodnight Moon", author:"Margaret Wise Brown", rating:4.7, genres:["Children's","Picture Book"], contentRating:"All Ages", pages:32, words:135, language:"English", series:null, description:"In a great green room, a young bunny says goodnight to everything around him — the red balloon, the bowl of mush, the old lady whispering hush — in this beloved bedtime classic.", warnings:[], tropes:["Cozy","Bedtime"], tags:["Picture Book","Bedtime","Classic","Cozy","Rhyming","Animals"] },
  { id:205, isbn:"9780060256654", title:"The Giving Tree", author:"Shel Silverstein", rating:4.6, genres:["Children's","Picture Book"], contentRating:"All Ages", pages:64, words:620, language:"English", series:null, description:"A tree loves a boy unconditionally through every stage of his life, giving him her apples, branches, and trunk — and finding happiness in giving.", warnings:["Emotional Themes","Loneliness"], tropes:["Sacrifice","Unconditional Love","Bittersweet Ending","Coming of Age"], tags:["Picture Book","Emotional","Classic","Nature","Heartwarming","Friendship"] },
  { id:206, isbn:"9780394800165", title:"Green Eggs and Ham", author:"Dr. Seuss", rating:4.8, genres:["Children's","Picture Book"], contentRating:"All Ages", pages:64, words:789, language:"English", series:null, description:"Sam-I-Am persistently tries to convince a grumpy character to try green eggs and ham in every possible setting and situation, teaching a lasting lesson about keeping an open mind.", warnings:[], tropes:["Persistence","Open-Mindedness"], tags:["Picture Book","Rhyming","Humor","Classic","Educational","Food"] },
  { id:207, isbn:"9780394800012", title:"The Cat in the Hat", author:"Dr. Seuss", rating:4.8, genres:["Children's","Picture Book"], contentRating:"All Ages", pages:61, words:1629, language:"English", series:null, description:"On a cold, wet day, two bored children are visited by a tall talking cat who arrives with a red bow tie and wild tricks, causing increasingly outrageous chaos before tidying up.", warnings:["Mild Mischief"], tropes:["Trickster","Adventure","Chaos and Order"], tags:["Picture Book","Rhyming","Humor","Classic","Mischief","Iconic"] },
  { id:208, isbn:"9780142410370", title:"Matilda", author:"Roald Dahl", rating:4.8, genres:["Children's","Fantasy","Fiction"], contentRating:"All Ages", pages:240, words:64000, language:"English", series:null, description:"Matilda is a brilliant girl with a photographic memory and neglectful parents. When she discovers she has telekinetic powers, she takes on the terrifying Headmistress Miss Trunchbull to protect her beloved teacher.", warnings:["Child Abuse","Bullying","Neglect","Violence"], tropes:["Chosen One","Underdog","Mentor Figure","Found Family","Revenge"], tags:["Magic","School Setting","Humor","Dark","Empowerment","Classic"] },
  { id:209, isbn:"9780142410363", title:"James and the Giant Peach", author:"Roald Dahl", rating:4.6, genres:["Children's","Fantasy","Fiction"], contentRating:"All Ages", pages:146, words:36000, language:"English", series:null, description:"Miserable James lives with his horrible aunts until magic items cause an enormous peach to grow, carrying him across the ocean on an extraordinary adventure with giant insect companions.", warnings:["Child Abuse","Death","Violence"], tropes:["Quest","Found Family","Magical World","Underdog"], tags:["Adventure","Humor","Dark","Magic","Classic","Animals"] },
  { id:210, isbn:"9780142410318", title:"Charlie and the Chocolate Factory", author:"Roald Dahl", rating:4.8, genres:["Children's","Fantasy","Fiction"], contentRating:"All Ages", pages:176, words:45000, language:"English", series:null, description:"Charlie Bucket wins one of five Golden Tickets granting a tour of Willy Wonka's mysterious chocolate factory, where terrible and magical things happen to the other children along the way.", warnings:["Child Peril","Dark Humor","Mild Violence"], tropes:["Chosen One","Underdog","Moral Lessons","Rags to Riches"], tags:["Humor","Dark","Fantasy","Food","Adventure","Classic","Magic"] },
  { id:211, isbn:"9780142410387", title:"The BFG", author:"Roald Dahl", rating:4.7, genres:["Children's","Fantasy","Fiction"], contentRating:"All Ages", pages:195, words:50000, language:"English", series:null, description:"Sophie is snatched from her orphanage by the Big Friendly Giant, who blows good dreams into children's rooms. Together they must stop the other bloodthirsty giants from eating the children of England.", warnings:["Child Peril","Violence","Dark Themes"], tropes:["Unlikely Friendship","Adventure","Underdog","Found Family"], tags:["Fantasy","Humor","Adventure","Friendship","Classic","Magic"] },
  { id:212, isbn:"9780440414803", title:"Holes", author:"Louis Sachar", rating:4.7, genres:["Children's","Fiction","Mystery"], contentRating:"Teen", pages:233, words:47000, language:"English", series:null, description:"Stanley Yelnats is sent to Camp Green Lake, a juvenile detention facility in the Texas desert, where boys are forced to dig holes. He gradually uncovers the camp's dark secret and his family's curse.", warnings:["Violence","Bullying","Death","Racism","Child Abuse"], tropes:["Underdog","Multi-Generational","Found Family","Mystery","Rags to Riches"], tags:["Adventure","Mystery","Humor","Friendship","Dark","Historical"] },
  { id:213, isbn:"9780394820378", title:"The Phantom Tollbooth", author:"Norton Juster", rating:4.5, genres:["Children's","Fantasy","Fiction"], contentRating:"All Ages", pages:255, words:56000, language:"English", series:null, description:"Bored Milo drives his toy car through a phantom tollbooth and enters the Lands Beyond, where numbers and letters are at war and he must rescue the banished princesses Rhyme and Reason.", warnings:[], tropes:["Quest","Coming of Age","Adventure","Unusual Companion"], tags:["Adventure","Humor","Wordplay","Classic","Fantasy","Educational"] },
  { id:214, isbn:"9780312367541", title:"A Wrinkle in Time", author:"Madeleine L'Engle", rating:4.4, genres:["Children's","Fantasy","Sci-Fi","Fiction"], contentRating:"All Ages", pages:256, words:49000, language:"English", series:{name:"Time Quintet",number:1,status:"Completed"}, description:"Meg Murry, her brother Charles Wallace, and friend Calvin travel through a tesseract to rescue Meg's father from a dark force that has imprisoned him on a distant planet.", warnings:["Violence","Mind Control","Peril"], tropes:["Chosen One","Quest","Sibling Bond","Found Family","Science Hero"], tags:["Adventure","Sci-Fi","Family","Good vs Evil","Classic","Magic"] },
  { id:215, isbn:"9780064401845", title:"Bridge to Terabithia", author:"Katherine Paterson", rating:4.6, genres:["Children's","Fiction"], contentRating:"Teen", pages:163, words:32000, language:"English", series:null, description:"Jesse Aarons and Leslie Burke develop an unlikely friendship and create an imaginary kingdom called Terabithia in the woods. But a sudden tragedy changes Jesse's world forever.", warnings:["Death","Child Death","Grief","Bullying"], tropes:["Unlikely Friendship","Coming of Age","Tragedy","Imagination"], tags:["Emotional","Friendship","Grief","Classic","Coming of Age","Heartbreaking"] },
  { id:216, isbn:"9780142437056", title:"The Secret Garden", author:"Frances Hodgson Burnett", rating:4.5, genres:["Children's","Fiction","Classics"], contentRating:"All Ages", pages:331, words:90000, language:"English", series:null, description:"Orphaned Mary Lennox arrives at the cold, forbidding Misselthwaite Manor, where she discovers a locked garden shut for ten years and begins to restore both it and the mysterious invalid boy living inside.", warnings:["Death","Grief","Neglect"], tropes:["Transformation","Coming of Age","Found Family","Healing"], tags:["Classic","Nature","Friendship","Healing","Historical","Family"] },
  { id:217, isbn:"9780525444443", title:"Winnie-the-Pooh", author:"A.A. Milne", rating:4.8, genres:["Children's","Fiction","Classics"], contentRating:"All Ages", pages:161, words:30000, language:"English", series:{name:"Winnie-the-Pooh",number:1,status:"Completed"}, description:"In the Hundred Acre Wood, a bear of very little brain and his friends — Piglet, Eeyore, Owl, and Kanga — share gentle, cheerful adventures full of honey and good humor.", warnings:[], tropes:["Found Family","Cozy","Friendship","Simple Life"], tags:["Cozy","Friendship","Classic","Animals","Humor","Heartwarming"] },
  { id:218, isbn:"9780064404990", title:"The Lion, the Witch and the Wardrobe", author:"C.S. Lewis", rating:4.8, genres:["Children's","Fantasy","Fiction"], contentRating:"All Ages", pages:206, words:38000, language:"English", series:{name:"The Chronicles of Narnia",number:2,status:"Completed"}, description:"Four siblings step through a wardrobe into Narnia, a magical land locked in eternal winter by the White Witch, where they join the great lion Aslan to defeat her and fulfill an ancient prophecy.", warnings:["Violence","Death","War","Betrayal"], tropes:["Chosen One","Quest","Found Family","Good vs Evil","Magical World"], tags:["Adventure","Magic","Classic","Good vs Evil","Fantasy","Animals"] },
  { id:219, isbn:"9781416936473", title:"Hatchet", author:"Gary Paulsen", rating:4.5, genres:["Children's","Fiction","Adventure"], contentRating:"Teen", pages:195, words:42000, language:"English", series:{name:"Brian's Saga",number:1,status:"Completed"}, description:"Thirteen-year-old Brian is the sole survivor of a plane crash in the Canadian wilderness. With nothing but a hatchet and his wits, he must figure out how to survive the wild and the coming winter.", warnings:["Peril","Death","Survival Themes","Loneliness","Trauma"], tropes:["Survival","Lone Survivor","Coming of Age","Man vs Nature"], tags:["Adventure","Survival","Nature","Coming of Age","Wilderness","Classic"] },
  { id:220, isbn:"9780670557516", title:"Pippi Longstocking", author:"Astrid Lindgren", rating:4.5, genres:["Children's","Fiction"], contentRating:"All Ages", pages:160, words:31000, language:"Swedish", series:{name:"Pippi Longstocking",number:1,status:"Completed"}, description:"Pippi Longstocking lives alone with her horse and monkey, does whatever she pleases, and is the strongest girl in the world — her unconventional ways charm and challenge all the children around her.", warnings:[], tropes:["Strong Female Lead","Underdog","Trickster","Found Family"], tags:["Humor","Adventure","Classic","Friendship","Feminist","Animals"] },
  { id:221, isbn:"9780143107507", title:"The Wonderful Wizard of Oz", author:"L. Frank Baum", rating:4.5, genres:["Children's","Fantasy","Fiction","Classics"], contentRating:"All Ages", pages:272, words:39000, language:"English", series:{name:"Oz",number:1,status:"Completed"}, description:"Dorothy and her dog Toto are swept away by a tornado to the magical land of Oz, where she follows the yellow brick road to the Emerald City to ask the great Wizard to send her home.", warnings:["Mild Peril","Violence"], tropes:["Quest","Found Family","Good vs Evil","Coming Home"], tags:["Adventure","Fantasy","Classic","Magic","Friendship","Iconic"] },
  { id:222, isbn:"9780141325200", title:"Peter Pan", author:"J.M. Barrie", rating:4.4, genres:["Children's","Fantasy","Fiction","Classics"], contentRating:"All Ages", pages:226, words:50000, language:"English", series:null, description:"The Darling children fly away with the magical boy Peter Pan to Neverland, where children never grow up, mermaids swim in lagoons, and the villainous Captain Hook schemes to destroy Peter.", warnings:["Violence","Mild Peril","Kidnapping"], tropes:["Magical World","Coming of Age","Found Family","Adventure"], tags:["Fantasy","Adventure","Classic","Magic","Flying","Pirates"] },
  { id:223, isbn:"9780141439761", title:"Alice's Adventures in Wonderland", author:"Lewis Carroll", rating:4.4, genres:["Children's","Fantasy","Fiction","Classics"], contentRating:"All Ages", pages:199, words:27500, language:"English", series:null, description:"Alice falls down a rabbit hole into a topsy-turvy world of talking animals, mad tea parties, and a furious queen who demands heads — where nothing makes sense and logic is delightfully useless.", warnings:["Mild Violence","Absurdity"], tropes:["Magical World","Fish Out of Water","Quest"], tags:["Fantasy","Humor","Classic","Surreal","Adventure","Nonsense"] },
  { id:224, isbn:"9780064400022", title:"Little House on the Prairie", author:"Laura Ingalls Wilder", rating:4.5, genres:["Children's","Historical Fiction","Fiction"], contentRating:"All Ages", pages:334, words:69000, language:"English", series:{name:"Little House",number:3,status:"Completed"}, description:"The Ingalls family leaves their Wisconsin woods home to travel across the open prairie, building a new life in Kansas Territory amid beauty, hardship, and tension with Native Americans.", warnings:["Racism","Mild Peril","Illness","Death"], tropes:["Family","Pioneer Life","Coming of Age","Survival"], tags:["Historical","Family","Classic","Nature","Adventure","Pioneer"] },
  { id:225, isbn:"9780810993136", title:"Diary of a Wimpy Kid", author:"Jeff Kinney", rating:4.3, genres:["Children's","Fiction","Humor"], contentRating:"All Ages", pages:217, words:19000, language:"English", series:{name:"Diary of a Wimpy Kid",number:1,status:"Ongoing"}, description:"Greg Heffley records his middle-school life in this illustrated diary, navigating the treacherous social terrain of sixth grade with his own mix of scheming, cowardice, and occasional good intentions.", warnings:["Bullying","Mild Language"], tropes:["Underdog","Humor","School Setting","Coming of Age"], tags:["Humor","School Setting","Friendship","Family","Relatable","Illustrated"] },
  { id:226, isbn:"9780689710681", title:"Mrs. Frisby and the Rats of NIMH", author:"Robert C. O'Brien", rating:4.5, genres:["Children's","Fantasy","Fiction"], contentRating:"All Ages", pages:233, words:55000, language:"English", series:null, description:"Widowed field mouse Mrs. Frisby must move her sick son before the farmer's plow arrives. Desperate, she seeks help from a mysterious colony of superintelligent rats who escaped a scientific laboratory.", warnings:["Death","Animal Testing","Peril"], tropes:["Unlikely Hero","Quest","Sacrifice","Found Family"], tags:["Adventure","Fantasy","Animals","Science","Classic","Friendship"] },
  { id:227, isbn:"9780689711817", title:"From the Mixed-Up Files of Mrs. Basil E. Frankweiler", author:"E.L. Konigsburg", rating:4.4, genres:["Children's","Mystery","Fiction"], contentRating:"All Ages", pages:162, words:32000, language:"English", series:null, description:"Claudia and her brother secretly run away and hide inside the Metropolitan Museum of Art in New York City, where they stumble upon a mystery about a beautiful statue possibly sculpted by Michelangelo.", warnings:["Running Away","Mild Peril"], tropes:["Mystery","Siblings","Adventure","Fish Out of Water"], tags:["Mystery","Adventure","Art","Classic","Siblings","New York"] },
  { id:228, isbn:"9780440416791", title:"Harriet the Spy", author:"Louise Fitzhugh", rating:4.2, genres:["Children's","Fiction"], contentRating:"All Ages", pages:298, words:65000, language:"English", series:null, description:"Harriet keeps brutally honest notes on the people around her — until her classmates find her notebook and read what she has written about each of them, shattering her social world.", warnings:["Bullying","Betrayal","Emotional Distress"], tropes:["Coming of Age","Outcast","Friendship","Consequences"], tags:["School Setting","Friendship","Writing","Classic","Humor","Relatable"] },
  { id:229, isbn:"9780142401316", title:"Roll of Thunder, Hear My Cry", author:"Mildred D. Taylor", rating:4.5, genres:["Children's","Historical Fiction","Fiction"], contentRating:"Teen", pages:276, words:65000, language:"English", series:{name:"Logan Family",number:2,status:"Completed"}, description:"Nine-year-old Cassie Logan grows up as a Black girl in Mississippi during the Great Depression, learning hard lessons about racial injustice while her family fights fiercely to hold onto their land and dignity.", warnings:["Racism","Violence","Death","Burning","Injustice"], tropes:["Coming of Age","Strong Female Lead","Family","Social Justice"], tags:["Historical","Family","Social Justice","Dark","Classic","Emotional"] },
  { id:230, isbn:"9780547577098", title:"Number the Stars", author:"Lois Lowry", rating:4.6, genres:["Children's","Historical Fiction","Fiction"], contentRating:"Teen", pages:137, words:28000, language:"English", series:null, description:"In Nazi-occupied Copenhagen, ten-year-old Annemarie helps her Jewish best friend's family escape to Sweden as Danish resistance fighters risk everything to save their neighbors.", warnings:["War","Death","Violence","Historical Tragedy"], tropes:["Unlikely Hero","Sacrifice","Friendship","Coming of Age"], tags:["Historical","War","Friendship","Inspirational","WWII","Emotional"] },
  { id:231, isbn:"9780439120425", title:"Esperanza Rising", author:"Pam Muñoz Ryan", rating:4.5, genres:["Children's","Historical Fiction","Fiction"], contentRating:"Teen", pages:262, words:58000, language:"English", series:null, description:"Esperanza grows up wealthy in Mexico until tragedy strikes and she must flee to California as a migrant farm worker during the Great Depression, learning what it truly means to rise from nothing.", warnings:["Violence","Death","Poverty","Labor Exploitation","Grief"], tropes:["Rags to Riches","Coming of Age","Strong Female Lead","Transformation"], tags:["Historical","Family","Social Justice","Immigration","Inspirational","Emotional"] },
  { id:232, isbn:"9780062014412", title:"The One and Only Ivan", author:"Katherine Applegate", rating:4.5, genres:["Children's","Fiction"], contentRating:"All Ages", pages:305, words:26000, language:"English", series:null, description:"Ivan is a gorilla who has lived for years in a shopping mall. When a baby elephant named Ruby arrives and faces a bleak future, Ivan makes a promise that will change everything for them both.", warnings:["Animal Captivity","Animal Abuse","Separation"], tropes:["Found Family","Unlikely Friendship","Sacrifice","Animals"], tags:["Animals","Friendship","Emotional","Art","Inspirational","Heartwarming"] },
  { id:233, isbn:"9780689818769", title:"Frindle", author:"Andrew Clements", rating:4.4, genres:["Children's","Fiction"], contentRating:"All Ages", pages:105, words:19000, language:"English", series:null, description:"Creative Nick Allen decides to call a pen a 'frindle' — and the word spreads to his whole school and beyond, clashing gloriously with his word-loving teacher in ways neither of them expected.", warnings:[], tropes:["Underdog","School Setting","Humor","Coming of Age"], tags:["School Setting","Humor","Language","Friendship","Clever","Classic"] },
  { id:234, isbn:"9780064402057", title:"Sarah, Plain and Tall", author:"Patricia MacLachlan", rating:4.3, genres:["Children's","Historical Fiction","Fiction"], contentRating:"All Ages", pages:98, words:14000, language:"English", series:{name:"Sarah, Plain and Tall",number:1,status:"Completed"}, description:"Anna and Caleb, two prairie children who lost their mother, wait anxiously for their father's mail-order bride Sarah to arrive from Maine, hoping she will love the prairie and stay to be their family.", warnings:["Death","Grief"], tropes:["Found Family","Quiet Romance","Healing","Prairie Life"], tags:["Historical","Family","Heartwarming","Classic","Short","Simple"] },
  { id:235, isbn:"9780394890487", title:"My Father's Dragon", author:"Ruth Stiles Gannett", rating:4.3, genres:["Children's","Fantasy","Fiction"], contentRating:"All Ages", pages:87, words:15000, language:"English", series:{name:"My Father's Dragon",number:1,status:"Completed"}, description:"Elmer Elevator sets off to Wild Island with a carefully packed knapsack to rescue a baby dragon held captive by the island's animals, who use him as a flying ferry.", warnings:[], tropes:["Quest","Adventure","Rescue","Unusual Companion"], tags:["Adventure","Fantasy","Classic","Short","Animals","Magic"] },
  { id:236, isbn:"9780064408677", title:"The Trumpet of the Swan", author:"E.B. White", rating:4.3, genres:["Children's","Fiction"], contentRating:"All Ages", pages:252, words:38000, language:"English", series:null, description:"Louis is a Trumpeter Swan born without a voice. With the help of a boy named Sam, he learns to play the trumpet and sets out to earn money to repay his father's debt and win the love of Serena.", warnings:[], tropes:["Underdog","Coming of Age","Unlikely Friendship","Music"], tags:["Animals","Music","Adventure","Classic","Heartwarming","Friendship"] },
  { id:237, isbn:"9780064400695", title:"Stuart Little", author:"E.B. White", rating:4.2, genres:["Children's","Fiction","Classics"], contentRating:"All Ages", pages:131, words:21000, language:"English", series:null, description:"Stuart Little is born into a New York family as a mouse and leads a busy, adventurous life — eventually setting off in a tiny car to find his missing bird friend Margalo.", warnings:[], tropes:["Quest","Unlikely Hero","Adventure","Friendship"], tags:["Animals","Adventure","Classic","Humor","Friendship","New York"] },
  { id:238, isbn:"9780547328614", title:"Island of the Blue Dolphins", author:"Scott O'Dell", rating:4.4, genres:["Children's","Historical Fiction","Fiction"], contentRating:"Teen", pages:181, words:38000, language:"English", series:null, description:"When her tribe is forced off their California island, twelve-year-old Karana is left behind alone. She survives for eighteen years using only her wits, making weapons and befriending a wild dog.", warnings:["Loneliness","Violence","Death","Animal Death"], tropes:["Survival","Strong Female Lead","Lone Survivor","Man vs Nature"], tags:["Historical","Survival","Nature","Animals","Classic","Adventure"] },
  { id:239, isbn:"9780380709557", title:"Ramona the Pest", author:"Beverly Cleary", rating:4.3, genres:["Children's","Fiction"], contentRating:"All Ages", pages:192, words:34000, language:"English", series:{name:"Ramona Quimby",number:2,status:"Completed"}, description:"Ramona Quimby is thrilled to start kindergarten, but her irrepressible spirit keeps landing her in trouble — especially when she can't stop pulling a classmate's beautiful curly hair.", warnings:["Bullying","Mild Conflict"], tropes:["Coming of Age","School Setting","Humor","Underdog"], tags:["School Setting","Humor","Family","Relatable","Classic","Friendship"] },
  { id:240, isbn:"9780763644321", title:"Because of Winn-Dixie", author:"Kate DiCamillo", rating:4.4, genres:["Children's","Fiction"], contentRating:"All Ages", pages:182, words:22000, language:"English", series:null, description:"Ten-year-old Opal and her preacher father are new in town. When she adopts a big goofy dog from the Winn-Dixie supermarket, the lovable mutt helps her make friends, find community, and begin to heal.", warnings:["Grief","Loneliness","Mild Peril"], tropes:["Found Family","Unlikely Friendship","Healing","Coming of Age"], tags:["Animals","Friendship","Family","Heartwarming","Classic","Small Town"] },
  { id:241, isbn:"9780763625894", title:"The Tale of Despereaux", author:"Kate DiCamillo", rating:4.4, genres:["Children's","Fantasy","Fiction"], contentRating:"All Ages", pages:272, words:36000, language:"English", series:null, description:"Despereaux Tilling is a tiny mouse who falls in love with a princess and must save her from the dungeon with the help of a rat, a servant girl, and the power of a story.", warnings:["Violence","Mild Peril","Imprisonment"], tropes:["Unlikely Hero","Quest","Rescue","Found Family","Multiple POV"], tags:["Fantasy","Adventure","Friendship","Bravery","Classic","Animals"] },
  { id:242, isbn:"9780440413288", title:"Bud, Not Buddy", author:"Christopher Paul Curtis", rating:4.5, genres:["Children's","Historical Fiction","Fiction"], contentRating:"Teen", pages:245, words:52000, language:"English", series:null, description:"Ten-year-old Bud Caldwell escapes a brutal foster home during the Great Depression, armed with a suitcase full of rules for life, and sets out across Michigan to find the jazz musician he believes is his father.", warnings:["Orphan","Death","Violence","Poverty","Child Abuse"], tropes:["Quest","Coming of Age","Found Family","Underdog"], tags:["Historical","Music","Family","Adventure","Humor","Emotional"] },
  { id:243, isbn:"9780440414124", title:"The Watsons Go to Birmingham—1963", author:"Christopher Paul Curtis", rating:4.5, genres:["Children's","Historical Fiction","Fiction"], contentRating:"Teen", pages:210, words:44000, language:"English", series:null, description:"The funny, warm Watson family drives from Flint, Michigan to Birmingham to visit Grandma. But the trip turns devastating when they witness firsthand the violence and terror of the Civil Rights era.", warnings:["Racism","Violence","Death","Historical Tragedy","Child Death"], tropes:["Family","Coming of Age","Road Trip","Historical"], tags:["Historical","Family","Dark","Civil Rights","Emotional","Humor"] },
  { id:244, isbn:"9780545581608", title:"Dog Man", author:"Dav Pilkey", rating:4.5, genres:["Children's","Fiction","Graphic Novel","Humor"], contentRating:"All Ages", pages:240, words:5000, language:"English", series:{name:"Dog Man",number:1,status:"Ongoing"}, description:"When a police officer and his K-9 companion are injured in an explosion, surgeons attach the dog's head to the officer's body — creating Dog Man, half man, half dog, and total hero.", warnings:["Slapstick Violence"], tropes:["Hero","Humor","Underdog","Good vs Evil"], tags:["Humor","Illustrated","Graphic Novel","Action","Superhero","Kids"] },
  { id:245, isbn:"9780380714759", title:"The True Confessions of Charlotte Doyle", author:"Avi", rating:4.4, genres:["Children's","Historical Fiction","Adventure","Fiction"], contentRating:"Teen", pages:232, words:52000, language:"English", series:null, description:"In 1832, thirteen-year-old Charlotte Doyle boards a transatlantic ship, only to find herself caught in a mutiny. Step by step, she transforms from a proper young lady into a determined sailor.", warnings:["Violence","Death","Murder","Child Peril"], tropes:["Strong Female Lead","Coming of Age","Adventure","Transformation"], tags:["Historical","Adventure","Feminist","Action","Ocean","Classic"] },
  { id:246, isbn:"9780807508527", title:"The Boxcar Children", author:"Gertrude Chandler Warner", rating:4.3, genres:["Children's","Mystery","Fiction"], contentRating:"All Ages", pages:154, words:22000, language:"English", series:{name:"The Boxcar Children",number:1,status:"Ongoing"}, description:"Four orphaned siblings — Henry, Jessie, Violet, and Benny — run away and make their home in an abandoned boxcar in the woods, learning to take care of themselves before their grandfather finds them.", warnings:["Orphan","Mild Peril"], tropes:["Found Family","Siblings","Survival","Mystery"], tags:["Adventure","Family","Mystery","Classic","Independence","Friendship"] },
  { id:247, isbn:"9780312380038", title:"The Cricket in Times Square", author:"George Selden", rating:4.3, genres:["Children's","Fiction"], contentRating:"All Ages", pages:151, words:26000, language:"English", series:null, description:"A Connecticut cricket named Chester accidentally arrives in the Times Square subway station, where he befriends Mario, a boy whose family runs a struggling newsstand, and Tucker the mouse and Harry the cat.", warnings:[], tropes:["Unlikely Friendship","Found Family","Music","Adventure"], tags:["Animals","Friendship","Music","Classic","New York","Heartwarming"] },
  { id:248, isbn:"9780143039099", title:"The Wind in the Willows", author:"Kenneth Grahame", rating:4.4, genres:["Children's","Fiction","Classics"], contentRating:"All Ages", pages:224, words:57000, language:"English", series:null, description:"Along the banks of a river, four animal friends — Mole, Rat, Badger, and the irrepressible Mr. Toad — share adventures, misadventures, and the very deep pleasures of friendship and home.", warnings:["Mild Peril","Imprisonment"], tropes:["Found Family","Friendship","Adventure","Cozy"], tags:["Animals","Classic","Friendship","Cozy","Nature","Adventure"] },
  { id:249, isbn:"9780380731787", title:"Sideways Stories from Wayside School", author:"Louis Sachar", rating:4.4, genres:["Children's","Fiction","Humor"], contentRating:"All Ages", pages:124, words:19000, language:"English", series:{name:"Wayside School",number:1,status:"Completed"}, description:"Wayside School was supposed to be one story high with thirty classrooms, but was accidentally built thirty stories high with one classroom per story — and the students on the thirtieth floor are delightfully strange.", warnings:[], tropes:["Humor","School Setting","Absurdity"], tags:["Humor","School Setting","Classic","Absurdity","Short Stories","Kids"] },
  { id:250, isbn:"9780142408551", title:"Encyclopedia Brown, Boy Detective", author:"Donald J. Sobol", rating:4.2, genres:["Children's","Mystery","Fiction"], contentRating:"All Ages", pages:96, words:17000, language:"English", series:{name:"Encyclopedia Brown",number:1,status:"Completed"}, description:"Ten-year-old Leroy 'Encyclopedia' Brown runs a detective agency from his garage, solving neighborhood mysteries for twenty-five cents a day plus expenses — with each mystery hidden in the story for readers to solve.", warnings:[], tropes:["Child Genius","Mystery","Underdog","Logic"], tags:["Mystery","Clever","Classic","Short Stories","Kids","Puzzle"] },

  // ─── YA & Up (251–300) ───
  { id:251, isbn:"9781250012579", title:"Eleanor & Park", author:"Rainbow Rowell", rating:4.3, genres:["YA","Romance","Fiction"], contentRating:"Teen", pages:336, words:76000, language:"English", series:null, description:"In 1986 Omaha, two misfits meet on a school bus — Eleanor, the new girl with the wild red hair, and Park, the half-Korean kid who loves comic books and mix tapes. They fall together in a way that changes both of them forever.", warnings:["Bullying","Domestic Violence","Child Abuse","Strong Language","Racism"], tropes:["Slow Burn","Enemies to Lovers","Coming of Age","Opposites Attract"], tags:["Romance","Emotional","Music","Comics","1980s","Heartbreaking"] },
  { id:252, isbn:"9780062348678", title:"Simon vs. the Homo Sapiens Agenda", author:"Becky Albertalli", rating:4.4, genres:["YA","Romance","Fiction"], contentRating:"Teen", pages:303, words:72000, language:"English", series:null, description:"Sixteen-year-old Simon Spier isn't out to his family yet. But when an email accidentally reveals his secret identity to the wrong person, Simon is blackmailed while trying to figure out who his anonymous online love interest really is.", warnings:["Outing","Blackmail","Bullying","Strong Language"], tropes:["Slow Burn","Coming of Age","Identity","Mystery"], tags:["LGBTQ+","Romance","Humor","School Setting","Coming of Age","Heartwarming"] },
  { id:253, isbn:"9780140385724", title:"The Outsiders", author:"S.E. Hinton", rating:4.5, genres:["YA","Fiction"], contentRating:"Teen", pages:192, words:48500, language:"English", series:null, description:"Fourteen-year-old Ponyboy Curtis is a Greaser at war with the Socs. When a night of violence has devastating consequences, Ponyboy must confront loyalty, class, and what it means to grow up.", warnings:["Violence","Death","Gangs","Strong Language","Suicide Ideation"], tropes:["Found Family","Coming of Age","Class Differences","Tragedy"], tags:["Classic","Social Commentary","Friendship","Dark","Emotional","Action"] },
  { id:254, isbn:"9780062498533", title:"The Hate U Give", author:"Angie Thomas", rating:4.7, genres:["YA","Fiction"], contentRating:"Teen", pages:444, words:93000, language:"English", series:null, description:"Sixteen-year-old Starr Carter witnesses the fatal police shooting of her unarmed childhood best friend. Pulled between her poor neighborhood and her fancy prep school, she must decide to speak her truth.", warnings:["Police Violence","Racism","Death","Violence","Strong Language","Drugs"], tropes:["Strong Female Lead","Social Justice","Coming of Age","Identity"], tags:["Social Commentary","Racism","Family","Emotional","Contemporary","Important"] },
  { id:255, isbn:"9780312674397", title:"Speak", author:"Laurie Halse Anderson", rating:4.5, genres:["YA","Fiction"], contentRating:"Teen", pages:197, words:46000, language:"English", series:null, description:"Melinda Sordino begins high school as an outcast after calling the police at an end-of-summer party. As she retreats into silence, she struggles to face the trauma of what really happened that night.", warnings:["Sexual Assault","Depression","Bullying","Social Isolation","Trauma","Self-Harm"], tropes:["Strong Female Lead","Healing","Coming of Age","Unreliable Narrator"], tags:["Contemporary","Dark","Important","Feminist","Emotional","Recovery"] },
  { id:256, isbn:"9781250027436", title:"Shadow and Bone", author:"Leigh Bardugo", rating:4.3, genres:["YA","Fantasy","Fiction"], contentRating:"Teen", pages:358, words:93000, language:"English", series:{name:"Shadow and Bone",number:1,status:"Completed"}, description:"Alina Starkov discovers she possesses a rare power that could help her country, but the handsome and enigmatic Darkling who controls the magical Grisha army has his own plans for her gift.", warnings:["Violence","Death","Manipulation","War","Dark Themes"], tropes:["Chosen One","Slow Burn","Enemies to Lovers","Strong Female Lead","Mentor Figure"], tags:["Fantasy","Romance","Adventure","Magic","Dark","Action"] },
  { id:257, isbn:"9780062059949", title:"The Selection", author:"Kiera Cass", rating:4.0, genres:["YA","Romance","Sci-Fi","Fiction"], contentRating:"Teen", pages:327, words:76000, language:"English", series:{name:"The Selection",number:1,status:"Completed"}, description:"America Singer is selected to compete for the heart of Prince Maxon in a competition that is part reality TV show, part contest to become queen — but she only agreed to go to escape her secret love.", warnings:["Violence","Class Division"], tropes:["Love Triangle","Chosen One","Slow Burn","Political Intrigue"], tags:["Romance","Dystopia","Adventure","Competition","Royalty","Action"] },
  { id:258, isbn:"9780525423645", title:"Matched", author:"Ally Condie", rating:3.9, genres:["YA","Sci-Fi","Romance","Fiction"], contentRating:"Teen", pages:366, words:98000, language:"English", series:{name:"Matched",number:1,status:"Completed"}, description:"In the Society, officials decide who you marry, what you eat, and when you die. Cassia has always trusted their choices — until the day she is Matched and something goes wrong, opening her eyes to a different world.", warnings:["Death","Oppressive Government","Loss of Freedom"], tropes:["Dystopia","Love Triangle","Coming of Age","Slow Burn"], tags:["Romance","Sci-Fi","Adventure","Dark","Political","Action"] },
  { id:259, isbn:"9780399256752", title:"Legend", author:"Marie Lu", rating:4.2, genres:["YA","Sci-Fi","Fiction"], contentRating:"Teen", pages:305, words:75000, language:"English", series:{name:"Legend",number:1,status:"Completed"}, description:"In the Republic of America, fifteen-year-old June is a military prodigy hunting the country's most wanted criminal — Day — a rebel fighting for the poor. When their paths cross, they find unlikely common ground.", warnings:["Violence","Death","Oppressive Government","Experimentation"], tropes:["Enemies to Lovers","Strong Female Lead","Dual POV","Revolution"], tags:["Action","Romance","Adventure","Dystopia","Sci-Fi","Dark"] },
  { id:260, isbn:"9780553499117", title:"Illuminae", author:"Amie Kaufman & Jay Kristoff", rating:4.4, genres:["YA","Sci-Fi","Fiction"], contentRating:"Teen", pages:599, words:145000, language:"English", series:{name:"The Illuminae Files",number:1,status:"Completed"}, description:"Told through hacked files, military transmissions, and instant messages, this is the story of Kady and Ezra, who flee a corporate warship after their planet is attacked — with a rogue AI and a deadly plague standing in their way.", warnings:["Violence","Death","Mental Health","Suicide","Graphic Violence","Psychological Horror"], tropes:["Enemies to Lovers","Dual POV","Science Hero","Survival"], tags:["Sci-Fi","Action","Romance","Unique Format","Dark","Space"] },
  { id:261, isbn:"9780399501487", title:"Lord of the Flies", author:"William Golding", rating:4.1, genres:["Fiction","Classics","YA"], contentRating:"Teen", pages:224, words:60000, language:"English", series:null, description:"A group of British boys are stranded on an uninhabited island after their plane is shot down. What begins as an attempt to govern themselves quickly descends into savagery, revealing the darkness beneath civilization.", warnings:["Violence","Death","Child Violence","Murder","Animal Cruelty","Trauma"], tropes:["Social Experiment","Survival","Tragedy","Coming of Age","Multiple POV"], tags:["Classic","Dark","Philosophical","Social Commentary","Survival","Horror"] },
  { id:262, isbn:"9780312369811", title:"Tuck Everlasting", author:"Natalie Babbitt", rating:4.2, genres:["Children's","Fantasy","Fiction"], contentRating:"All Ages", pages:139, words:22000, language:"English", series:null, description:"Ten-year-old Winnie Foster discovers the Tuck family's secret — they drank from a spring that made them immortal. As she grapples with whether immortality is a gift or a curse, a sinister stranger lurks nearby.", warnings:["Death","Violence","Murder","Kidnapping"], tropes:["Coming of Age","Forbidden Love","Sacrifice","Bittersweet Ending"], tags:["Fantasy","Philosophical","Classic","Emotional","Family","Short"] },
  { id:263, isbn:"9781101939529", title:"Dear Martin", author:"Nic Stone", rating:4.3, genres:["YA","Fiction"], contentRating:"Teen", pages:210, words:43000, language:"English", series:null, description:"Justyce McAllister is top of his class and bound for an Ivy League school — but still gets handcuffed by a police officer. He starts writing letters to Martin Luther King Jr. as he navigates race, privilege, and injustice in America.", warnings:["Racism","Police Violence","Death","Violence","Strong Language"], tropes:["Coming of Age","Social Justice","Identity"], tags:["Contemporary","Social Commentary","Racism","Emotional","Important","Family"] },
  { id:264, isbn:"9781481438261", title:"Long Way Down", author:"Jason Reynolds", rating:4.4, genres:["YA","Fiction"], contentRating:"Teen", pages:306, words:17000, language:"English", series:null, description:"Fifteen seconds after his brother is shot, Will reaches for his brother's gun and steps into an elevator. In the sixty seconds it takes to descend seven floors, the ghosts of gun violence step in and tell him what he's about to do.", warnings:["Death","Violence","Gang Violence","Guns","Drugs","Strong Language"], tropes:["Revenge","Tragedy","Social Commentary","Coming of Age"], tags:["Dark","Social Commentary","Poetry","Unique Format","Emotional","Important"] },
  { id:265, isbn:"9780553496642", title:"Everything, Everything", author:"Nicola Yoon", rating:4.0, genres:["YA","Romance","Fiction"], contentRating:"Teen", pages:310, words:50000, language:"English", series:null, description:"Madeline has been sick her entire life and never left her house. Then Olly moves in next door, and soon she is willing to risk everything — even her own life — for the possibility of love.", warnings:["Illness","Parental Manipulation","Deception","Risk-Taking"], tropes:["Star-Crossed Lovers","Forbidden Love","Coming of Age","Healing"], tags:["Romance","Contemporary","Emotional","Illness","Heartwarming","Unique Format"] },
  { id:266, isbn:"9780316015844", title:"Twilight", author:"Stephenie Meyer", rating:3.9, genres:["YA","Romance","Fantasy","Fiction"], contentRating:"Teen", pages:498, words:118000, language:"English", series:{name:"Twilight",number:1,status:"Completed"}, description:"Bella Swan moves to a small rainy town and falls deeply in love with Edward Cullen — impossibly handsome, unnervingly fast, and a vampire who is fighting the urge to kill her.", warnings:["Violence","Death","Obsessive Relationship","Blood"], tropes:["Forbidden Love","Star-Crossed Lovers","Slow Burn","Love Triangle"], tags:["Romance","Fantasy","Supernatural","Dark","Iconic","Vampires"] },
  { id:267, isbn:"9780545424929", title:"The Raven Boys", author:"Maggie Stiefvater", rating:4.3, genres:["YA","Fantasy","Fiction"], contentRating:"Teen", pages:409, words:106000, language:"English", series:{name:"The Raven Cycle",number:1,status:"Completed"}, description:"Blue Sargent has always been told she will kill her true love with a kiss. When she meets Gansey and his circle of Raven Boys searching for a sleeping Welsh king, she is drawn into magic she can't escape.", warnings:["Death","Violence","Dark Themes","Prophecy"], tropes:["Slow Burn","Found Family","Star-Crossed Lovers","Mystery","Magic"], tags:["Fantasy","Romance","Mystery","Dark","Atmospheric","Friendship"] },
  { id:268, isbn:"9781250095268", title:"Caraval", author:"Stephanie Garber", rating:4.1, genres:["YA","Fantasy","Fiction"], contentRating:"Teen", pages:407, words:103000, language:"English", series:{name:"Caraval",number:1,status:"Completed"}, description:"Scarlett and her sister finally receive tickets to Caraval — a legendary magical performance where the audience participates. But when her sister goes missing, Scarlett discovers the game is far more dangerous than anyone said.", warnings:["Violence","Death","Manipulation","Dark Themes","Captivity"], tropes:["Sisters","Mystery","Slow Burn","Magical World","Unreliable Narrator"], tags:["Fantasy","Adventure","Romance","Dark","Atmospheric","Mystery"] },
  { id:269, isbn:"9781984896360", title:"A Good Girl's Guide to Murder", author:"Holly Jackson", rating:4.5, genres:["YA","Mystery","Thriller","Fiction"], contentRating:"Teen", pages:455, words:107000, language:"English", series:{name:"A Good Girl's Guide to Murder",number:1,status:"Completed"}, description:"Five years ago, Andie Bell was murdered by her boyfriend. The case is closed. But Pippa Fitz-Amobi believes the wrong person was accused, and her school project reopens a very dangerous investigation.", warnings:["Death","Murder","Violence","Strong Language","Drugs","Sexual Content"], tropes:["Amateur Detective","Mystery","Unlikely Partnership","Dark Secret"], tags:["Mystery","Thriller","Crime","Friendship","Contemporary","Suspense"] },
  { id:270, isbn:"9780316341677", title:"Strange the Dreamer", author:"Laini Taylor", rating:4.4, genres:["YA","Fantasy","Fiction"], contentRating:"Teen", pages:544, words:146000, language:"English", series:{name:"Strange the Dreamer",number:1,status:"Completed"}, description:"A young librarian named Lazlo Strange has dreamed all his life of the lost city of Weep. When he gets the chance to go there, he discovers blue-skinned godspawn living in the sky and a girl who paints nightmares.", warnings:["Violence","Death","Slavery","War","Child Death","Dark Themes"], tropes:["Star-Crossed Lovers","Slow Burn","Chosen One","Magical World","Enemies to Lovers"], tags:["Fantasy","Romance","Adventure","Dark","Atmospheric","Epic"] },
  { id:271, isbn:"9781442472426", title:"Scythe", author:"Neal Shusterman", rating:4.5, genres:["YA","Sci-Fi","Fiction"], contentRating:"Teen", pages:435, words:111000, language:"English", series:{name:"Arc of a Scythe",number:1,status:"Completed"}, description:"In a future where humanity has conquered death, Scythes are the only ones who can end a life. Two teens are chosen to apprentice with one whose methods and motivations may be more sinister than they appear.", warnings:["Death","Violence","Murder","Dark Themes","Suicide"], tropes:["Chosen One","Moral Dilemma","Slow Burn","Dark Mentor"], tags:["Sci-Fi","Dark","Action","Philosophical","Future","Suspense"] },
  { id:272, isbn:"9780743297332", title:"The Sun Also Rises", author:"Ernest Hemingway", rating:4.1, genres:["Fiction","Classics"], contentRating:"Adult", pages:251, words:69000, language:"English", series:null, description:"American expatriate journalist Jake Barnes and his crowd travel from Paris to Pamplona for the running of the bulls. Beneath the fiesta and the drinking lies a profound sadness about love, war, and the Lost Generation.", warnings:["Alcoholism","War","Grief","Antisemitism","Strong Language"], tropes:["Love Triangle","Tragedy","Unreliable Narrator","Star-Crossed Lovers"], tags:["Classic","Literary","Historical","Dark","1920s","Expatriate"] },
  { id:273, isbn:"9780140177398", title:"Of Mice and Men", author:"John Steinbeck", rating:4.2, genres:["Fiction","Classics"], contentRating:"Adult", pages:187, words:30000, language:"English", series:null, description:"George and Lennie are migrant workers who dream of owning their own land — a dream that the harsh and lonely world they inhabit seems determined to destroy.", warnings:["Violence","Death","Murder","Racism","Ableism","Poverty","Strong Language"], tropes:["Unlikely Friendship","Tragedy","Dream vs Reality","Sacrifice"], tags:["Classic","Dark","Philosophical","Historical","Short","Emotional"] },
  { id:274, isbn:"9780525478812", title:"Looking for Alaska", author:"John Green", rating:4.1, genres:["YA","Fiction"], contentRating:"Teen", pages:221, words:65000, language:"English", series:null, description:"Miles 'Pudge' Halter enrolls at Culver Creek boarding school in search of the 'Great Perhaps,' where he becomes obsessed with the magnetic and mysterious Alaska Young — a girl who changes everything and then breaks everything.", warnings:["Death","Depression","Alcoholism","Sexual Content","Strong Language","Suicide"], tropes:["Coming of Age","Tragedy","Slow Burn","School Setting"], tags:["Contemporary","Dark","School Setting","Emotional","Romance","Loss"] },
  { id:275, isbn:"9780375869020", title:"Wonder", author:"R.J. Palacio", rating:4.7, genres:["YA","Fiction"], contentRating:"Teen", pages:315, words:73000, language:"English", series:null, description:"Ten-year-old August Pullman was born with a facial difference. When he starts mainstream school for the first time, his journey is told from multiple perspectives — each revealing the ripple effect of one extraordinary kid.", warnings:["Bullying","Grief","Death"], tropes:["Underdog","Coming of Age","Multiple POV","Social Justice"], tags:["Emotional","Family","School Setting","Inspirational","Kindness","Heartwarming"] },
  { id:276, isbn:"9780803738171", title:"I'll Give You the Sun", author:"Jandy Nelson", rating:4.4, genres:["YA","Fiction","Romance"], contentRating:"Teen", pages:371, words:98000, language:"English", series:null, description:"Twins Noah and Jude tell the same story from different points in time, revealing how their perfect shared world shattered and whether art, love, and a little magic can put them back together.", warnings:["Death","Grief","Sexual Content","Bullying","Violence","Strong Language"], tropes:["Dual POV","Siblings","Slow Burn","Coming of Age","Tragedy"], tags:["LGBTQ+","Art","Romance","Family","Emotional","Contemporary"] },
  { id:277, isbn:"9780670026609", title:"Me Before You", author:"Jojo Moyes", rating:4.4, genres:["Fiction","Romance"], contentRating:"Adult", pages:369, words:96000, language:"English", series:{name:"Me Before You",number:1,status:"Completed"}, description:"Lou Clark takes a job caring for Will Traynor, a former investment banker left paralyzed after an accident. What begins as just a job becomes something that will permanently change both their lives.", warnings:["Disability","Assisted Suicide","Death","Depression","Strong Language"], tropes:["Opposites Attract","Healing","Forbidden Love","Bittersweet Ending"], tags:["Romance","Emotional","Contemporary","Heartbreaking","Disability","Important"] },
  { id:278, isbn:"9780316044950", title:"The Lovely Bones", author:"Alice Sebold", rating:4.0, genres:["Fiction"], contentRating:"Adult", pages:372, words:89000, language:"English", series:null, description:"Fourteen-year-old Susie Salmon is murdered by a neighbor. From her personal heaven, she watches her family and killer as they deal with her absence — and searches for a way to help them find peace.", warnings:["Murder","Sexual Assault","Death","Child Death","Grief","Violence","Disturbing Content"], tropes:["Multiple POV","Tragedy","Healing","Afterlife"], tags:["Dark","Literary","Supernatural","Grief","Family","Emotional"] },
  { id:279, isbn:"9781442426702", title:"To All the Boys I've Loved Before", author:"Jenny Han", rating:4.1, genres:["YA","Romance","Fiction"], contentRating:"Teen", pages:355, words:79000, language:"English", series:{name:"To All the Boys",number:1,status:"Completed"}, description:"Lara Jean Song Covey writes letters to every boy she's ever loved — letters she never intends to send. But when all five letters are mysteriously mailed, her secret love life becomes very public.", warnings:["Mild Sexual Content","Bullying"], tropes:["Fake Dating","Slow Burn","Love Letter","Coming of Age"], tags:["Romance","Contemporary","Humor","School Setting","Heartwarming","Family"] },
  { id:280, isbn:"9781416968290", title:"The Summer I Turned Pretty", author:"Jenny Han", rating:4.2, genres:["YA","Romance","Fiction"], contentRating:"Teen", pages:276, words:64000, language:"English", series:{name:"The Summer I Turned Pretty",number:1,status:"Completed"}, description:"Belly spends every summer at Cousins Beach with the Fisher boys. This is the summer everything changes — the summer she is finally pretty, and the summer a love triangle begins.", warnings:["Illness","Death","Grief","Mild Sexual Content"], tropes:["Love Triangle","Summer Romance","Coming of Age","Slow Burn"], tags:["Romance","Summer","Beach","Coming of Age","Family","Contemporary"] },
  { id:281, isbn:"9780553496680", title:"The Sun Is Also a Star", author:"Nicola Yoon", rating:4.1, genres:["YA","Romance","Fiction"], contentRating:"Teen", pages:348, words:67000, language:"English", series:null, description:"Natasha doesn't believe in fate. Daniel does. In the space of a single day in New York City — the day Natasha's family is scheduled to be deported back to Jamaica — their paths cross in a way that changes everything.", warnings:["Immigration","Racism","Violence","Family Separation"], tropes:["Star-Crossed Lovers","Dual POV","One Day","Coming of Age"], tags:["Romance","Contemporary","Diverse","New York","Emotional","Important"] },
  { id:282, isbn:"9781250255402", title:"Cemetery Boys", author:"Aiden Thomas", rating:4.3, genres:["YA","Fantasy","Romance","Fiction"], contentRating:"Teen", pages:351, words:95000, language:"English", series:null, description:"Brujo Yadriel wants to prove himself to his traditional family by summoning the ghost of a murdered classmate. But the ghost of bad-boy Julian Diaz refuses to move on — and Yadriel begins to understand why.", warnings:["Death","Violence","Murder","Grief"], tropes:["Enemies to Lovers","Forbidden Love","Slow Burn","Supernatural"], tags:["LGBTQ+","Romance","Fantasy","Supernatural","Halloween","Diverse"] },
  { id:283, isbn:"9781534437050", title:"These Violent Delights", author:"Chloe Gong", rating:4.2, genres:["YA","Fantasy","Fiction"], contentRating:"Teen", pages:449, words:120000, language:"English", series:{name:"These Violent Delights",number:1,status:"Completed"}, description:"Set in 1926 Shanghai, former lovers Juliette Cai and Roma Montagov — heirs to rival gangs — must work together when a mysterious madness spreads through the city, driving people to tear out their own throats.", warnings:["Violence","Death","Body Horror","Insects","Graphic Content","Strong Language","Drug Use"], tropes:["Enemies to Lovers","Star-Crossed Lovers","Dual POV","Political Intrigue"], tags:["Fantasy","Dark","Historical","Romance","Action","Atmospheric"] },
  { id:284, isbn:"9781250786807", title:"Iron Widow", author:"Xiran Jay Zhao", rating:4.2, genres:["YA","Sci-Fi","Fantasy","Fiction"], contentRating:"Teen", pages:394, words:103000, language:"English", series:{name:"Iron Widow",number:1,status:"Ongoing"}, description:"In a world inspired by Tang Dynasty China, girls are sacrificed as co-pilots to male pilots of giant mecha. Zetian volunteers to avenge her sister's death — and discovers she has a terrifying power that could change everything.", warnings:["Violence","Death","Sexual Violence","Oppression","Strong Language"], tropes:["Strong Female Lead","Revenge","Chosen One","Love Triangle"], tags:["Sci-Fi","Fantasy","Feminist","Action","Dark","Diverse"] },
  { id:285, isbn:"9780374314545", title:"Firekeeper's Daughter", author:"Angeline Boulley", rating:4.4, genres:["YA","Mystery","Thriller","Fiction"], contentRating:"Teen", pages:496, words:122000, language:"English", series:null, description:"Daunis Fontaine is part Ojibwe and was raised on the reservation. When she witnesses a murder and agrees to work as an undercover informant to investigate a drug case, she risks everything she loves.", warnings:["Death","Violence","Drug Use","Murder","Racism","Sexual Assault"], tropes:["Amateur Detective","Strong Female Lead","Coming of Age","Identity"], tags:["Mystery","Thriller","Indigenous","Contemporary","Dark","Important"] },
  { id:286, isbn:"9780385537858", title:"You", author:"Caroline Kepnes", rating:3.8, genres:["Fiction","Thriller"], contentRating:"Adult", pages:422, words:101000, language:"English", series:{name:"You",number:1,status:"Ongoing"}, description:"When Beck walks into Joe Goldberg's bookstore, he is immediately smitten. He follows her online, then in person — all while narrating his obsession in unsettlingly reasonable terms. A dark dissection of modern romance and stalking.", warnings:["Stalking","Murder","Violence","Sexual Content","Manipulation","Strong Language","Dark Themes"], tropes:["Unreliable Narrator","Anti-Hero","Obsession","Dark Romance"], tags:["Thriller","Dark","Psychological","Contemporary","Disturbing","Crime"] },
  { id:287, isbn:"9780152053659", title:"Graceling", author:"Kristin Cashore", rating:4.3, genres:["YA","Fantasy","Fiction"], contentRating:"Teen", pages:471, words:119000, language:"English", series:{name:"Graceling Realm",number:1,status:"Completed"}, description:"Katsa is Graced with the skill of killing, used as her king's enforcer. She begins to question her violent purpose — until she meets Prince Po and uncovers a conspiracy that threatens every kingdom.", warnings:["Violence","Death","Manipulation","Abuse","Dark Themes"], tropes:["Strong Female Lead","Slow Burn","Political Intrigue","Chosen One","Found Family"], tags:["Fantasy","Adventure","Feminist","Romance","Action","Dark"] },
  { id:288, isbn:"9781442403543", title:"Unwind", author:"Neal Shusterman", rating:4.3, genres:["YA","Sci-Fi","Fiction"], contentRating:"Teen", pages:335, words:82000, language:"English", series:{name:"Unwind Dystology",number:1,status:"Completed"}, description:"In a future America, unwanted teenagers can be 'unwound' — harvested for their body parts so every piece of them lives on in someone else. Connor, Risa, and Lev are all scheduled to be unwound. They run.", warnings:["Violence","Death","Body Horror","Child Abuse","Oppressive Government","Disturbing Content"], tropes:["Survival","Road Trip","Multiple POV","Revolution"], tags:["Sci-Fi","Dark","Dystopia","Action","Philosophical","Suspense"] },
  { id:289, isbn:"9780525478188", title:"Paper Towns", author:"John Green", rating:3.9, genres:["YA","Mystery","Fiction"], contentRating:"Teen", pages:305, words:75000, language:"English", series:null, description:"The night before high school graduation, Margo Roth Spiegelman takes Quentin on a midnight adventure — then disappears. Convinced she left him clues, Q embarks on a road trip to find her and discovers unsettling truths.", warnings:["Strong Language","Mild Sexual Content","Missing Person"], tropes:["Road Trip","Mystery","Coming of Age"], tags:["Contemporary","Mystery","Humor","Friendship","Road Trip","School Setting"] },
  { id:290, isbn:"9780316042680", title:"Beautiful Creatures", author:"Kami Garcia & Margaret Stohl", rating:3.8, genres:["YA","Fantasy","Romance","Fiction"], contentRating:"Teen", pages:563, words:140000, language:"English", series:{name:"Caster Chronicles",number:1,status:"Completed"}, description:"In a small South Carolina town, Ethan Wate is drawn to the mysterious new girl Lena Duchanels. On her sixteenth birthday she will be claimed by either the light or the dark — and there is nothing either of them can do to stop it.", warnings:["Violence","Death","Dark Magic","Strong Language"], tropes:["Forbidden Love","Slow Burn","Chosen One","Star-Crossed Lovers"], tags:["Fantasy","Romance","Supernatural","Southern Gothic","Dark","School Setting"] },
  { id:291, isbn:"9781619630611", title:"Crown of Midnight", author:"Sarah J. Maas", rating:4.5, genres:["YA","Fantasy","Fiction"], contentRating:"Teen", pages:418, words:122000, language:"English", series:{name:"Throne of Glass",number:2,status:"Completed"}, description:"Celaena Sardothien serves the corrupt king as royal assassin but secretly defies him at every turn. When a shocking secret is revealed, she must choose between her own freedom and a destiny far bigger than herself.", warnings:["Violence","Death","Murder","Dark Themes","Strong Language","Grief"], tropes:["Slow Burn","Strong Female Lead","Found Family","Enemies to Lovers","Political Intrigue"], tags:["Fantasy","Action","Romance","Dark","Adventure","Epic"] },
  { id:292, isbn:"9780525477983", title:"If I Stay", author:"Gayle Forman", rating:4.1, genres:["YA","Fiction","Romance"], contentRating:"Teen", pages:260, words:56000, language:"English", series:{name:"If I Stay",number:1,status:"Completed"}, description:"In a split second, Mia — a gifted cellist — loses everything in a car accident. While her body lies in a coma, she watches the aftermath and must make the most profound choice of her life: is there still enough reason to stay?", warnings:["Death","Grief","Car Accident","Family Death","Coma"], tropes:["Bittersweet Ending","Star-Crossed Lovers","Coming of Age","Tragedy"], tags:["Romance","Music","Emotional","Grief","Contemporary","Heartbreaking"] },
  { id:293, isbn:"9780142415474", title:"Where She Went", author:"Gayle Forman", rating:4.2, genres:["YA","Fiction","Romance"], contentRating:"Teen", pages:264, words:55000, language:"English", series:{name:"If I Stay",number:2,status:"Completed"}, description:"It's been three years since Mia chose to stay — and Adam is now a famous rock star drowning in anger and pain. When they meet again for one night in New York, everything unresolved between them finally comes to the surface.", warnings:["Depression","Grief","Drug Use","Strong Language","Self-Destructive Behavior"], tropes:["Second Chance Romance","Dual POV","Slow Burn","Music"], tags:["Romance","Music","Emotional","Contemporary","Healing","Heartbreaking"] },
  { id:294, isbn:"9780374309992", title:"The Winner's Curse", author:"Marie Rutkoski", rating:4.1, genres:["YA","Fantasy","Romance","Fiction"], contentRating:"Teen", pages:355, words:88000, language:"English", series:{name:"The Winner's Trilogy",number:1,status:"Completed"}, description:"Kestrel, daughter of a Valorian general, impulsively buys a slave named Arin at auction. As feelings develop between them, Kestrel discovers Arin is hiding a dangerous secret that could undo everything she loves.", warnings:["Slavery","Violence","Death","War","Manipulation"], tropes:["Enemies to Lovers","Forbidden Love","Political Intrigue","Slow Burn"], tags:["Fantasy","Romance","Dark","War","Strategy","Action"] },
  { id:295, isbn:"9780451469786", title:"The Young Elites", author:"Marie Lu", rating:4.1, genres:["YA","Fantasy","Fiction"], contentRating:"Teen", pages:355, words:89000, language:"English", series:{name:"The Young Elites",number:1,status:"Completed"}, description:"Adelina is a survivor of a blood fever that left her scarred — but also with a strange power. Recruited by an elite secret society, she begins a terrifying journey toward power and revenge, becoming a villain rather than a hero.", warnings:["Violence","Death","Abuse","Torture","Dark Themes","Strong Language"], tropes:["Anti-Hero","Villain Protagonist","Chosen One","Revenge","Slow Burn"], tags:["Fantasy","Dark","Action","Psychological","Diverse","Epic"] },
  { id:296, isbn:"9781423157953", title:"The Darkest Minds", author:"Alexandra Bracken", rating:4.2, genres:["YA","Sci-Fi","Fiction"], contentRating:"Teen", pages:488, words:119000, language:"English", series:{name:"The Darkest Minds",number:1,status:"Completed"}, description:"After a disease kills most American children, the survivors develop supernatural powers and are locked in concentration camps. Sixteen-year-old Ruby escapes and joins a group of teens on the run, searching for a place where they can be safe.", warnings:["Violence","Death","Oppressive Government","Experimentation","Trauma","Abuse"], tropes:["Chosen One","Survival","Strong Female Lead","Found Family"], tags:["Sci-Fi","Dark","Action","Romance","Dystopia","Adventure"] },
  { id:297, isbn:"9780316133975", title:"Daughter of Smoke and Bone", author:"Laini Taylor", rating:4.4, genres:["YA","Fantasy","Fiction"], contentRating:"Teen", pages:418, words:106000, language:"English", series:{name:"Daughter of Smoke and Bone",number:1,status:"Completed"}, description:"Art student Karou lives a double life, running errands for a chimera merchant who deals in wishes. When mysterious handprints sear the world's portals and a seraph crosses her path, she begins to unravel the truth about who she really is.", warnings:["Violence","Death","War","Dark Themes","Body Horror"], tropes:["Star-Crossed Lovers","Identity","Forbidden Love","Slow Burn","Magic"], tags:["Fantasy","Romance","Adventure","Dark","Atmospheric","Epic"] },
  { id:298, isbn:"9780373211463", title:"Poison Study", author:"Maria V. Snyder", rating:4.3, genres:["YA","Fantasy","Fiction"], contentRating:"Teen", pages:409, words:105000, language:"English", series:{name:"Study",number:1,status:"Completed"}, description:"Yelena is about to be executed for murder when she is offered a deal: become the Commander's food taster or die. As she learns to detect poisons, she uncovers dark magic and mysteries about her own past.", warnings:["Violence","Death","Sexual Assault","Abuse","Dark Themes","Execution"], tropes:["Strong Female Lead","Slow Burn","Forbidden Love","Coming of Age","Dark Mentor"], tags:["Fantasy","Romance","Action","Dark","Adventure","Suspense"] },
  { id:299, isbn:"9781416955955", title:"Uglies", author:"Scott Westerfeld", rating:4.0, genres:["YA","Sci-Fi","Fiction"], contentRating:"Teen", pages:425, words:101000, language:"English", series:{name:"Uglies",number:1,status:"Completed"}, description:"In the future, everyone undergoes radical surgery at sixteen to become 'pretty.' Tally Youngblood can't wait — until she discovers the operation changes far more than appearance, and the girl who ran away rather than have it needs her help.", warnings:["Violence","Death","Oppressive Government","Mind Control","Deception"], tropes:["Chosen One","Dystopia","Coming of Age","Rebellion"], tags:["Sci-Fi","Adventure","Dark","Action","Dystopia","Philosophical"] },
  { id:300, isbn:"9781595143662", title:"The Witch of Blackbird Pond", author:"Elizabeth George Speare", rating:4.3, genres:["YA","Historical Fiction","Fiction"], contentRating:"Teen", pages:320, words:79000, language:"English", series:null, description:"Kit Tyler arrives in Puritan Connecticut from Barbados in 1687 and is immediately an outsider. Her friendship with an old Quaker woman labeled a witch draws dangerous suspicion, and Kit must fight for her life and her beliefs.", warnings:["Violence","Death","Witch Trials","Racism","Religious Persecution"], tropes:["Strong Female Lead","Coming of Age","Forbidden Love","Social Outcast"], tags:["Historical","Classic","Adventure","Romance","Dark","Colonial America"] },

  // ─── Children's Books (301–350) ───
  { id:301, isbn:"9780064401647", title:"A Little Princess", author:"Frances Hodgson Burnett", rating:4.6, genres:["Children's","Fiction","Classics"], contentRating:"All Ages", pages:256, words:68000, language:"English", series:null, description:"Sara Crewe arrives at Miss Minchin's boarding school in London as a privileged girl with a doting father. When tragedy strikes and she loses everything, she must survive as a servant girl — held up only by her imagination and her belief in herself.", warnings:["Death","Child Abuse","Poverty","Neglect","Bullying"], tropes:["Rags to Riches","Coming of Age","Strong Female Lead","Transformation","Underdog"], tags:["Classic","Family","Emotional","Historical","Heartwarming","Friendship"] },
  { id:302, isbn:"9780141321073", title:"Anne of Green Gables", author:"L.M. Montgomery", rating:4.7, genres:["Children's","Fiction","Classics"], contentRating:"All Ages", pages:320, words:83000, language:"English", series:{name:"Anne of Green Gables",number:1,status:"Completed"}, description:"An elderly brother and sister on Prince Edward Island request an orphan boy to help on their farm, but receive instead the irrepressible, red-haired, fiercely imaginative Anne Shirley — who changes their world forever.", warnings:["Orphan","Death","Grief"], tropes:["Found Family","Coming of Age","Underdog","Strong Female Lead"], tags:["Classic","Family","Humor","Nature","Heartwarming","Friendship"] },
  { id:303, isbn:"9780486400778", title:"The Adventures of Tom Sawyer", author:"Mark Twain", rating:4.3, genres:["Children's","Fiction","Classics"], contentRating:"Teen", pages:274, words:68000, language:"English", series:null, description:"Tom Sawyer is a clever, mischievous boy growing up along the Mississippi River. His adventures — tricking friends into whitewashing a fence, falling in love, and witnessing a murder — form a vivid portrait of American boyhood.", warnings:["Violence","Death","Murder","Racism","Mild Peril"], tropes:["Trickster","Adventure","Coming of Age","Unlikely Friendship"], tags:["Classic","Adventure","Humor","American","Historical","Mischief"] },
  { id:304, isbn:"9780141325286", title:"Black Beauty", author:"Anna Sewell", rating:4.5, genres:["Children's","Fiction","Classics"], contentRating:"All Ages", pages:255, words:65000, language:"English", series:null, description:"Black Beauty tells the story of his own life from his happy days as a foal to the hardships of working in the streets of London, narrating the cruelty and kindness of the various humans who own him.", warnings:["Animal Abuse","Death","Animal Death","Poverty"], tropes:["Survival","Rags to Riches","Unlikely Friendship","Healing"], tags:["Animals","Classic","Emotional","Historical","Social Commentary","Heartwarming"] },
  { id:305, isbn:"9780141321530", title:"The Jungle Book", author:"Rudyard Kipling", rating:4.3, genres:["Children's","Fiction","Classics"], contentRating:"All Ages", pages:233, words:50000, language:"English", series:null, description:"Mowgli is a boy raised by wolves in the jungles of India. His adventures — taught by Baloo the bear and Bagheera the panther — lead to inevitable confrontations with the tiger Shere Khan and a world he must choose between.", warnings:["Violence","Death","Animal Violence","Racism"], tropes:["Coming of Age","Found Family","Adventure","Man vs Nature"], tags:["Animals","Classic","Adventure","Nature","India","Coming of Age"] },
  { id:306, isbn:"9780152050856", title:"Mary Poppins", author:"P.L. Travers", rating:4.3, genres:["Children's","Fantasy","Fiction"], contentRating:"All Ages", pages:206, words:42000, language:"English", series:{name:"Mary Poppins",number:1,status:"Completed"}, description:"The Banks children of Number 17 Cherry Tree Lane are looked after by the mysterious and magical nanny Mary Poppins, who arrives on an East wind and leads them on astonishing adventures.", warnings:["Mild Peril"], tropes:["Magical Helper","Adventure","Found Family","Coming of Age"], tags:["Magic","Classic","Fantasy","Humor","Family","British"] },
  { id:307, isbn:"9780385077255", title:"The Velveteen Rabbit", author:"Margery Williams", rating:4.6, genres:["Children's","Fiction","Classics"], contentRating:"All Ages", pages:44, words:8000, language:"English", series:null, description:"A stuffed rabbit longs to become real through the love of a child. As seasons pass and his velveteen grows worn, he learns that love is what makes toys — and perhaps all of us — truly real.", warnings:["Illness","Separation","Loss"], tropes:["Transformation","Unconditional Love","Bittersweet Ending","Coming of Age"], tags:["Classic","Emotional","Heartwarming","Short","Magic","Family"] },
  { id:308, isbn:"9780544580190", title:"The Polar Express", author:"Chris Van Allsburg", rating:4.7, genres:["Children's","Picture Book","Fantasy"], contentRating:"All Ages", pages:32, words:1000, language:"English", series:null, description:"On Christmas Eve, a boy boards a magical train to the North Pole, where he receives a single silver bell from Santa — a gift that only those who believe can hear.", warnings:[], tropes:["Magic","Coming of Age","Belief","Wonder"], tags:["Christmas","Picture Book","Classic","Magic","Heartwarming","Winter"] },
  { id:309, isbn:"9780380807345", title:"Coraline", author:"Neil Gaiman", rating:4.5, genres:["Children's","Fantasy","Horror","Fiction"], contentRating:"Teen", pages:162, words:31000, language:"English", series:null, description:"Coraline Jones discovers a secret door in her new home that leads to a mirror world — at first a perfect replica with an Other Mother who seems wonderful. But the Other Mother wants to keep Coraline forever.", warnings:["Dark Themes","Body Horror","Psychological Horror","Violence","Child Peril","Eye Imagery"], tropes:["Brave Heroine","Dark Mirror","Rescue","Coming of Age"], tags:["Horror","Dark","Fantasy","Gothic","Suspense","Creepy"] },
  { id:310, isbn:"9780060530921", title:"The Graveyard Book", author:"Neil Gaiman", rating:4.6, genres:["Children's","Fantasy","Fiction"], contentRating:"Teen", pages:312, words:67000, language:"English", series:null, description:"After his family is murdered, a toddler wanders into a graveyard and is adopted by its ghostly inhabitants. Nobody Owens grows up among the dead, learning their ways — until the man who killed his family returns.", warnings:["Murder","Death","Violence","Child Peril","Dark Themes"], tropes:["Found Family","Coming of Age","Adventure","Dark World"], tags:["Fantasy","Dark","Gothic","Humor","Coming of Age","Supernatural"] },
  { id:311, isbn:"9780763673857", title:"A Monster Calls", author:"Patrick Ness", rating:4.6, genres:["Children's","Fantasy","Fiction"], contentRating:"Teen", pages:205, words:36000, language:"English", series:null, description:"At 12:07 in the night, a monster calls to Conor — ancient, enormous, and wild. It demands that Conor tell it three stories. But the monster already knows the real truth that Conor must face about his dying mother.", warnings:["Death","Terminal Illness","Grief","Emotional Distress","Parent Death"], tropes:["Coming of Age","Healing","Tragedy","Symbolism"], tags:["Emotional","Dark","Fantasy","Grief","Heartbreaking","Family"] },
  { id:312, isbn:"9780142401569", title:"The Westing Game", author:"Ellen Raskin", rating:4.4, genres:["Children's","Mystery","Fiction"], contentRating:"All Ages", pages:182, words:38000, language:"English", series:null, description:"Sixteen people are invited to live in a mysterious mansion and play the Westing Game — a contest to determine who among them murdered the eccentric millionaire Sam Westing and inherit his vast fortune.", warnings:["Death","Mystery","Mild Violence"], tropes:["Multiple POV","Mystery","Ensemble Cast","Red Herring"], tags:["Mystery","Clever","Classic","Puzzle","Suspense","Ensemble"] },
  { id:313, isbn:"9780064405195", title:"Walk Two Moons", author:"Sharon Creech", rating:4.5, genres:["Children's","Fiction"], contentRating:"Teen", pages:280, words:55000, language:"English", series:null, description:"Thirteen-year-old Salamanca Tree Hiddle makes a cross-country trip with her grandparents to find her missing mother. Along the way she tells them the story of her friend Phoebe, whose mother also disappeared.", warnings:["Death","Grief","Abandonment","Parent Loss"], tropes:["Road Trip","Coming of Age","Mystery","Dual Narrative"], tags:["Emotional","Family","Adventure","Mystery","Grief","Classic"] },
  { id:314, isbn:"9780316568951", title:"Maniac Magee", author:"Jerry Spinelli", rating:4.3, genres:["Children's","Fiction"], contentRating:"Teen", pages:184, words:35000, language:"English", series:null, description:"Jeffrey 'Maniac' Magee is a white orphan who wanders into a racially divided Pennsylvania town, performing legendary feats, crossing invisible barriers, and looking for somewhere — anywhere — to call home.", warnings:["Racism","Homelessness","Orphan","Violence","Bullying"], tropes:["Underdog","Coming of Age","Social Justice","Found Family"], tags:["Classic","Social Commentary","Humor","Friendship","Race","Adventure"] },
  { id:315, isbn:"9780553274295", title:"Where the Red Fern Grows", author:"Wilson Rawls", rating:4.6, genres:["Children's","Fiction","Classics"], contentRating:"Teen", pages:212, words:48000, language:"English", series:null, description:"Young Billy saves up money for two years to buy his two beloved redbone coonhounds, Old Dan and Little Ann. Together they become the finest hunting team in the Ozarks — until a tragedy changes everything.", warnings:["Death","Animal Death","Violence","Grief"], tropes:["Coming of Age","Unlikely Friendship","Man vs Nature","Sacrifice"], tags:["Animals","Emotional","Classic","Family","Heartbreaking","Outdoors"] },
  { id:316, isbn:"9780060935474", title:"Old Yeller", author:"Fred Gipson", rating:4.4, genres:["Children's","Fiction","Classics"], contentRating:"Teen", pages:184, words:32000, language:"English", series:null, description:"Fourteen-year-old Travis and his family's stray yellow dog form an inseparable bond on a Texas frontier farm in 1869. When Old Yeller saves the family from rabid animals, the bond is tested in an unforgettable way.", warnings:["Death","Animal Death","Violence","Illness","Grief"], tropes:["Coming of Age","Unlikely Friendship","Sacrifice","Man vs Nature"], tags:["Animals","Classic","Emotional","Historical","Heartbreaking","Family"] },
  { id:317, isbn:"9780142410332", title:"Danny the Champion of the World", author:"Roald Dahl", rating:4.5, genres:["Children's","Fiction"], contentRating:"All Ages", pages:220, words:47000, language:"English", series:null, description:"Danny lives in a gypsy caravan with his widowed father, the most wonderful father in the world. When Danny discovers his father's secret passion for poaching pheasants, the two hatch the most daring plan of their lives.", warnings:["Mild Peril","Mild Illegal Activity"], tropes:["Father-Son Bond","Adventure","Trickster","Underdog"], tags:["Humor","Family","Adventure","Classic","Heartwarming","Mischief"] },
  { id:318, isbn:"9780142408827", title:"The Witches", author:"Roald Dahl", rating:4.6, genres:["Children's","Fantasy","Fiction"], contentRating:"All Ages", pages:208, words:49000, language:"English", series:null, description:"A young boy and his Norwegian grandmother discover a secret convention of real witches — all disguised as ordinary women — and learn that these witches are plotting to turn all the children in England into mice.", warnings:["Child Peril","Dark Themes","Violence","Transformation"], tropes:["Adventure","Unlikely Hero","Coming of Age","Good vs Evil"], tags:["Dark","Fantasy","Humor","Classic","Creepy","Adventure"] },
  { id:319, isbn:"9780142410349", title:"Fantastic Mr Fox", author:"Roald Dahl", rating:4.5, genres:["Children's","Fiction"], contentRating:"All Ages", pages:96, words:10000, language:"English", series:null, description:"Three mean farmers are determined to rid themselves of the clever fox who raids their farms each night. As they dig furiously to catch Mr Fox, the fox digs right back — with a dazzling plan to feed his whole family.", warnings:["Mild Violence","Dark Humor"], tropes:["Trickster","Underdog","Found Family","Heist"], tags:["Humor","Animals","Classic","Short","Adventure","Family"] },
  { id:320, isbn:"9780062422408", title:"A Bear Called Paddington", author:"Michael Bond", rating:4.5, genres:["Children's","Fiction"], contentRating:"All Ages", pages:144, words:24000, language:"English", series:{name:"Paddington Bear",number:1,status:"Completed"}, description:"A small bear from Darkest Peru is found by the Brown family at Paddington Station in London. With his battered hat, suitcase, and passion for marmalade, Paddington navigates English life with charming mayhem.", warnings:[], tropes:["Fish Out of Water","Found Family","Humor","Adventure"], tags:["Humor","Classic","Animals","British","Family","Heartwarming"] },
  { id:321, isbn:"9780152047375", title:"The Borrowers", author:"Mary Norton", rating:4.3, genres:["Children's","Fantasy","Fiction"], contentRating:"All Ages", pages:215, words:38000, language:"English", series:{name:"The Borrowers",number:1,status:"Completed"}, description:"Pod, Homily, and their daughter Arrietty are tiny people called Borrowers who live beneath the floorboards of a grand house, surviving by borrowing small items from the humans above — until Arrietty makes a dangerous friendship.", warnings:["Peril","Capture","Mild Violence"], tropes:["Secret World","Unlikely Friendship","Adventure","Coming of Age"], tags:["Fantasy","Classic","Adventure","Small World","British","Cozy"] },
  { id:322, isbn:"9780763680909", title:"The Miraculous Journey of Edward Tulane", author:"Kate DiCamillo", rating:4.5, genres:["Children's","Fiction"], contentRating:"All Ages", pages:198, words:23000, language:"English", series:null, description:"Edward Tulane is a vain china rabbit who falls into the sea and passes through many hands — from a fisherman to a hobo to a dying child — learning to open his heart and love the people who love him.", warnings:["Death","Child Death","Grief","Loss","Illness"], tropes:["Transformation","Unconditional Love","Healing","Coming of Age"], tags:["Emotional","Heartbreaking","Animals","Classic","Short","Family"] },
  { id:323, isbn:"9780147514882", title:"Brown Girl Dreaming", author:"Jacqueline Woodson", rating:4.6, genres:["Children's","Non-Fiction","Historical Fiction"], contentRating:"Teen", pages:336, words:30000, language:"English", series:null, description:"Jacqueline Woodson tells the story of growing up during the 1960s and 70s, from South Carolina to Brooklyn — finding her voice as a writer during the Civil Rights movement, in prose poetry that sings.", warnings:["Racism","Segregation","Death","Poverty"], tropes:["Coming of Age","Social Justice","Finding Voice","Family"], tags:["Poetry","Historical","Memoir","Civil Rights","Family","Verse Novel"] },
  { id:324, isbn:"9781338157826", title:"Front Desk", author:"Kelly Yang", rating:4.5, genres:["Children's","Fiction"], contentRating:"Teen", pages:278, words:65000, language:"English", series:{name:"Front Desk",number:1,status:"Ongoing"}, description:"Ten-year-old Mia Tang and her immigrant parents manage a motel in California. While her parents dream of buying it one day, Mia is hiding undocumented immigrants in rooms — and fighting racism and exploitation one clever letter at a time.", warnings:["Racism","Immigration","Poverty","Exploitation","Violence"], tropes:["Underdog","Coming of Age","Social Justice","Found Family"], tags:["Immigration","Social Commentary","Family","Inspiring","Contemporary","Diverse"] },
  { id:325, isbn:"9781416949602", title:"The Dark Is Rising", author:"Susan Cooper", rating:4.4, genres:["Children's","Fantasy","Fiction"], contentRating:"Teen", pages:244, words:60000, language:"English", series:{name:"The Dark Is Rising Sequence",number:2,status:"Completed"}, description:"On the midwinter night before his eleventh birthday, Will Stanton discovers he is the last of the Old Ones, born to seek six magical Signs that will help in the eternal battle against the Dark.", warnings:["Violence","Death","Dark Themes","Peril"], tropes:["Chosen One","Good vs Evil","Coming of Age","Magic"], tags:["Fantasy","Dark","Classic","British","Adventure","Mythology"] },
  { id:326, isbn:"9780440413073", title:"Heidi", author:"Johanna Spyri", rating:4.3, genres:["Children's","Fiction","Classics"], contentRating:"All Ages", pages:251, words:70000, language:"German", series:null, description:"Young orphan Heidi is taken to live with her reclusive grandfather in the Swiss Alps. Her joy and spirit transforms his cold heart — but then she is taken away to live with a sickly girl in Frankfurt, and must find a way home.", warnings:["Orphan","Death","Illness","Separation","Grief"], tropes:["Found Family","Healing","Coming of Age","Nature"], tags:["Classic","Family","Nature","Alps","Heartwarming","Historical"] },
  { id:327, isbn:"9780064400596", title:"Julie of the Wolves", author:"Jean Craighead George", rating:4.3, genres:["Children's","Fiction"], contentRating:"Teen", pages:170, words:35000, language:"English", series:{name:"Julie of the Wolves",number:1,status:"Completed"}, description:"Miyax, a thirteen-year-old Inuit girl, becomes lost in the Alaskan wilderness while fleeing an arranged marriage. To survive, she must communicate with and gain the trust of a pack of Arctic wolves.", warnings:["Violence","Death","Animal Violence","Forced Marriage","Isolation"], tropes:["Survival","Strong Female Lead","Man vs Nature","Coming of Age"], tags:["Animals","Survival","Adventure","Nature","Classic","Alaska"] },
  { id:328, isbn:"9780142401118", title:"My Side of the Mountain", author:"Jean Craighead George", rating:4.4, genres:["Children's","Fiction","Adventure"], contentRating:"All Ages", pages:178, words:37000, language:"English", series:{name:"My Side of the Mountain",number:1,status:"Completed"}, description:"Fifteen-year-old Sam Gribley runs away from his New York City apartment to live alone in the Catskill Mountains. He makes his home in a hollowed-out tree and trains a peregrine falcon named Frightful.", warnings:["Isolation","Peril","Animal Death"], tropes:["Survival","Man vs Nature","Coming of Age","Lone Hero"], tags:["Adventure","Nature","Survival","Classic","Animals","Independence"] },
  { id:329, isbn:"9780689835827", title:"Shiloh", author:"Phyllis Reynolds Naylor", rating:4.3, genres:["Children's","Fiction"], contentRating:"All Ages", pages:144, words:25000, language:"English", series:{name:"Shiloh",number:1,status:"Completed"}, description:"When Marty Preston finds a stray beagle in the hills behind his West Virginia home, he names him Shiloh and hides him — but when the dog's abusive owner demands him back, Marty must make a painful moral choice.", warnings:["Animal Abuse","Moral Dilemma","Violence"], tropes:["Unlikely Friendship","Moral Lessons","Coming of Age","Underdog"], tags:["Animals","Family","Moral Dilemma","Classic","Small Town","Friendship"] },
  { id:330, isbn:"9780060236069", title:"The Whipping Boy", author:"Sid Fleischman", rating:4.3, genres:["Children's","Fiction","Adventure"], contentRating:"All Ages", pages:90, words:16000, language:"English", series:null, description:"Prince Brat never gets whipped for his misdeeds — Jemmy the orphan whipping boy takes his punishment instead. When the two are accidentally kidnapped together, their roles are reversed and an unlikely friendship begins.", warnings:["Violence","Child Abuse","Kidnapping","Poverty"], tropes:["Opposites Attract","Unlikely Friendship","Adventure","Swap"], tags:["Historical","Adventure","Humor","Classic","Short","Friendship"] },
  { id:331, isbn:"9780590846288", title:"The Adventures of Captain Underpants", author:"Dav Pilkey", rating:4.4, genres:["Children's","Fiction","Humor","Graphic Novel"], contentRating:"All Ages", pages:176, words:7500, language:"English", series:{name:"Captain Underpants",number:1,status:"Completed"}, description:"Best friends George and Harold accidentally hypnotize their mean principal into thinking he is Captain Underpants, a superhero with no actual superpowers — and then an actual evil scientist attacks the school.", warnings:["Slapstick Violence","Mild Gross Humor"], tropes:["Trickster","Hero","Unlikely Hero","School Setting"], tags:["Humor","Illustrated","Graphic Novel","Kids","School Setting","Silly"] },
  { id:332, isbn:"9780679824114", title:"Dinosaurs Before Dark", author:"Mary Pope Osborne", rating:4.3, genres:["Children's","Fantasy","Fiction"], contentRating:"All Ages", pages:96, words:6000, language:"English", series:{name:"Magic Tree House",number:1,status:"Ongoing"}, description:"Eight-year-old Jack and his seven-year-old sister Annie find a magic tree house in the woods that transports them back to the time of the dinosaurs, beginning their first extraordinary adventure through history.", warnings:["Mild Peril"], tropes:["Adventure","Siblings","Time Travel","Quest"], tags:["Adventure","History","Educational","Kids","Short","Magic"] },
  { id:333, isbn:"9780679826484", title:"Junie B. Jones and the Stupid Smelly Bus", author:"Barbara Park", rating:4.2, genres:["Children's","Fiction","Humor"], contentRating:"All Ages", pages:69, words:8000, language:"English", series:{name:"Junie B. Jones",number:1,status:"Completed"}, description:"Junie B. Jones is about to start kindergarten and is terrified of the school bus. When she decides to hide in the school instead of going home, she has a very big adventure all by herself.", warnings:[], tropes:["Underdog","School Setting","Humor","Coming of Age"], tags:["Humor","School Setting","Kids","Short","Relatable","Funny"] },
  { id:334, isbn:"9780064420266", title:"Flat Stanley", author:"Jeff Brown", rating:4.2, genres:["Children's","Fiction","Humor"], contentRating:"All Ages", pages:90, words:8500, language:"English", series:{name:"Flat Stanley",number:1,status:"Completed"}, description:"A bulletin board falls on Stanley Lambchop in the night, leaving him flat as a pancake. Stanley discovers some advantages — he can slide under doors, be mailed in an envelope, and even help catch art thieves.", warnings:["Mild Peril"], tropes:["Humor","Adventure","Unusual Hero","Coming of Age"], tags:["Humor","Kids","Classic","Short","Adventure","Silly"] },
  { id:335, isbn:"9780670654000", title:"The Snowy Day", author:"Ezra Jack Keats", rating:4.7, genres:["Children's","Picture Book"], contentRating:"All Ages", pages:32, words:275, language:"English", series:null, description:"Peter wakes to a snow-covered city and spends a perfect day exploring it alone — making tracks, sliding down a hill, and trying to save a snowball — in this landmark picture book.", warnings:[], tropes:["Wonder","Simple Life","Coming of Age"], tags:["Picture Book","Classic","Winter","Diverse","Iconic","Heartwarming"] },
  { id:336, isbn:"9780140501735", title:"Corduroy", author:"Don Freeman", rating:4.6, genres:["Children's","Picture Book"], contentRating:"All Ages", pages:32, words:700, language:"English", series:null, description:"Corduroy is a teddy bear who lives in a department store and longs for a home. When a little girl named Lisa wants to buy him, his missing button becomes a small adventure with a very big happy ending.", warnings:[], tropes:["Found Family","Unconditional Love","Belonging"], tags:["Picture Book","Classic","Heartwarming","Friendship","Simple","Animals"] },
  { id:337, isbn:"9780152802172", title:"Stellaluna", author:"Janell Cannon", rating:4.5, genres:["Children's","Picture Book","Fiction"], contentRating:"All Ages", pages:48, words:1500, language:"English", series:null, description:"When Stellaluna the fruit bat is separated from her mother and lands in a bird's nest, she must learn the birds' ways to survive — and eventually makes discoveries about friendship and what it means to be herself.", warnings:["Separation","Animal Peril"], tropes:["Found Family","Identity","Unlikely Friendship","Coming of Age"], tags:["Animals","Picture Book","Friendship","Nature","Heartwarming","Diversity"] },
  { id:338, isbn:"9780399214578", title:"Owl Moon", author:"Jane Yolen", rating:4.6, genres:["Children's","Picture Book"], contentRating:"All Ages", pages:32, words:500, language:"English", series:null, description:"A child and her father walk through the snowy winter woods late at night to go owling, sharing a quiet, magical experience built on patience and the wonder of nature.", warnings:[], tropes:["Wonder","Family Bond","Nature"], tags:["Picture Book","Nature","Family","Winter","Quiet","Lyrical"] },
  { id:339, isbn:"9780140564341", title:"Make Way for Ducklings", author:"Robert McCloskey", rating:4.6, genres:["Children's","Picture Book"], contentRating:"All Ages", pages:68, words:1500, language:"English", series:null, description:"Mr. and Mrs. Mallard search all over Boston for the perfect place to raise their family. When the ducklings finally hatch, Officer Michael helps them walk through the busy streets to their new home in the Public Garden.", warnings:[], tropes:["Family","Adventure","Kindness"], tags:["Picture Book","Classic","Animals","City","Heartwarming","Boston"] },
  { id:340, isbn:"9780142302378", title:"Redwall", author:"Brian Jacques", rating:4.5, genres:["Children's","Fantasy","Fiction","Adventure"], contentRating:"Teen", pages:351, words:99000, language:"English", series:{name:"Redwall",number:1,status:"Completed"}, description:"At Redwall Abbey, home to peaceful mice and woodland creatures, the young mouse Matthias must rise to the occasion when the villainous rat Cluny the Scourge lays siege to their beloved home.", warnings:["Violence","Death","War","Dark Themes"], tropes:["Chosen One","Found Family","Good vs Evil","Coming of Age","Quest"], tags:["Fantasy","Adventure","Animals","Epic","Classic","Good vs Evil"] },
  { id:341, isbn:"9780316782111", title:"The Rescuers", author:"Margery Sharp", rating:4.2, genres:["Children's","Fantasy","Fiction"], contentRating:"All Ages", pages:149, words:22000, language:"English", series:{name:"The Rescuers",number:1,status:"Completed"}, description:"The Mouse Prisoners' Aid Society sends brave Miss Bianca and the humble pantry mouse Bernard on a mission to rescue a Norwegian poet imprisoned in the Black Castle.", warnings:["Imprisonment","Mild Peril"], tropes:["Unlikely Friendship","Rescue","Adventure","Unlikely Hero"], tags:["Animals","Classic","Adventure","British","Short","Friendship"] },
  { id:342, isbn:"9780152025236", title:"Half Magic", author:"Edward Eager", rating:4.3, genres:["Children's","Fantasy","Fiction"], contentRating:"All Ages", pages:217, words:44000, language:"English", series:{name:"Tales of Magic",number:1,status:"Completed"}, description:"Four siblings find a coin that grants exactly half of every wish — leading to very strange and funny complications as they try to adventure through time and space with results that are never quite what they intended.", warnings:[], tropes:["Adventure","Siblings","Humor","Magical Object"], tags:["Magic","Humor","Classic","Fantasy","Adventure","Siblings"] },
  { id:343, isbn:"9780064401180", title:"Tom's Midnight Garden", author:"Philippa Pearce", rating:4.4, genres:["Children's","Fantasy","Fiction"], contentRating:"All Ages", pages:229, words:56000, language:"English", series:null, description:"Tom Long is unhappily staying with his aunt and uncle when he discovers that the garden outside — which is normally a paved yard by day — becomes an extraordinary Victorian garden every night at midnight.", warnings:["Loneliness","Grief","Time Themes"], tropes:["Magical World","Unlikely Friendship","Mystery","Bittersweet Ending"], tags:["Fantasy","Classic","Time Travel","Mystery","British","Heartwarming"] },
  { id:344, isbn:"9780440422402", title:"The Egypt Game", author:"Zilpha Keatley Snyder", rating:4.2, genres:["Children's","Mystery","Fiction"], contentRating:"Teen", pages:215, words:48000, language:"English", series:null, description:"A group of children create and play an elaborate game set in ancient Egypt in a deserted yard. But when a neighborhood child is murdered, the Egypt Game players find themselves in real danger.", warnings:["Murder","Child Death","Violence","Racism"], tropes:["Friendship","Mystery","Coming of Age","Adventure"], tags:["Mystery","Adventure","History","Classic","Friendship","Dark"] },
  { id:345, isbn:"9780395353776", title:"Jumanji", author:"Chris Van Allsburg", rating:4.4, genres:["Children's","Picture Book","Fantasy"], contentRating:"All Ages", pages:32, words:900, language:"English", series:null, description:"Two bored children find a board game called Jumanji and begin to play — only to discover that every hazard printed on the board becomes terrifyingly real, from monsoons to rhinos to lions.", warnings:["Peril","Mild Violence","Scary Imagery"], tropes:["Adventure","Consequences","Siblings","Game"], tags:["Picture Book","Fantasy","Classic","Thrilling","Adventure","Iconic"] },
  { id:346, isbn:"9780486280615", title:"Adventures of Huckleberry Finn", author:"Mark Twain", rating:4.2, genres:["Fiction","Classics","Children's"], contentRating:"Teen", pages:366, words:109000, language:"English", series:null, description:"Huck Finn fakes his own death to escape his abusive father and travels down the Mississippi River on a raft with the runaway slave Jim. Their journey is filled with adventure, danger, and moral awakening.", warnings:["Racism","Violence","Death","Child Abuse","Strong Language"], tropes:["Road Trip","Coming of Age","Unlikely Friendship","Social Justice","Moral Awakening"], tags:["Classic","Adventure","American","Historical","Dark","Social Commentary"] },
  { id:347, isbn:"9780061962783", title:"Inside Out and Back Again", author:"Thanhha Lai", rating:4.4, genres:["Children's","Historical Fiction","Fiction"], contentRating:"Teen", pages:262, words:21000, language:"English", series:null, description:"Based on the author's childhood, this verse novel tells the story of ten-year-old Hà, who flees Saigon with her family at the end of the Vietnam War and must adjust to life in Alabama, where everything is unfamiliar and strange.", warnings:["War","Racism","Bullying","Displacement","Grief"], tropes:["Coming of Age","Fish Out of Water","Strong Female Lead","Immigration"], tags:["Historical","Immigration","War","Verse Novel","Diverse","Family"] },
  { id:348, isbn:"9780142401804", title:"The House with a Clock in Its Walls", author:"John Bellairs", rating:4.3, genres:["Children's","Fantasy","Mystery","Fiction"], contentRating:"Teen", pages:179, words:45000, language:"English", series:{name:"Lewis Barnavelt",number:1,status:"Completed"}, description:"Ten-year-old Lewis goes to live with his eccentric uncle in a creaky old mansion. Strange ticking sounds come from the walls, and Lewis discovers his uncle is a warlock — and that a doomsday clock is hidden somewhere in the house.", warnings:["Dark Themes","Peril","Death","Magic","Scary Imagery"], tropes:["Chosen One","Mentor Figure","Found Family","Adventure","Mystery"], tags:["Fantasy","Horror","Mystery","Classic","Coming of Age","Dark"] },
  { id:349, isbn:"9780743277709", title:"Watership Down", author:"Richard Adams", rating:4.6, genres:["Fiction","Fantasy","Children's"], contentRating:"Teen", pages:413, words:156000, language:"English", series:null, description:"A group of rabbits led by Hazel and guided by a young rabbit's visions of danger leave their warren and make an epic journey across the English countryside to found a new home, facing terrible enemies along the way.", warnings:["Violence","Death","Animal Death","War","Dark Themes"], tropes:["Quest","Found Family","Unlikely Leader","Epic Journey","Chosen One"], tags:["Classic","Adventure","Epic","Animals","Dark","Fantasy"] },
  { id:350, isbn:"9780316209090", title:"The Phantom Tollbooth", author:"Norton Juster", rating:4.5, genres:["Children's","Fantasy","Fiction"], contentRating:"All Ages", pages:255, words:56000, language:"English", series:null, description:"A second edition entry: bored Milo drives through a phantom tollbooth and enters a land where numbers and letters are at war. He must rescue the banished princesses Rhyme and Reason to restore peace.", warnings:[], tropes:["Quest","Coming of Age","Adventure","Unusual Companion"], tags:["Adventure","Humor","Wordplay","Classic","Fantasy","Educational"] },

  // ─── YA & Up (351–400) ───
  { id:351, isbn:"9781416914297", title:"City of Bones", author:"Cassandra Clare", rating:4.1, genres:["YA","Fantasy","Fiction"], contentRating:"Teen", pages:485, words:130000, language:"English", series:{name:"The Mortal Instruments",number:1,status:"Completed"}, description:"Fifteen-year-old Clary Fray witnesses a murder by teenagers who seem to be invisible to everyone else. When her mother is kidnapped, she is drawn into a dangerous world of Shadowhunters — humans with angel blood who hunt demons.", warnings:["Violence","Death","Dark Themes","Romantic Tension","Strong Language"], tropes:["Chosen One","Found Family","Forbidden Love","Slow Burn","Identity"], tags:["Fantasy","Adventure","Romance","Dark","Action","Supernatural"] },
  { id:352, isbn:"9781416975885", title:"Clockwork Angel", author:"Cassandra Clare", rating:4.3, genres:["YA","Fantasy","Historical Fiction","Fiction"], contentRating:"Teen", pages:479, words:127000, language:"English", series:{name:"The Infernal Devices",number:1,status:"Completed"}, description:"Tessa Gray arrives in Victorian London searching for her brother and is captured by dark warlocks. Rescued by Shadowhunters Will and Jem, she must navigate a new supernatural world while uncovering the secret of her own mysterious power.", warnings:["Violence","Death","Dark Themes","Manipulation"], tropes:["Love Triangle","Slow Burn","Found Family","Identity","Coming of Age"], tags:["Fantasy","Romance","Historical","Victorian","Dark","Action"] },
  { id:353, isbn:"9781250030955", title:"Fangirl", author:"Rainbow Rowell", rating:4.3, genres:["YA","Fiction","Romance"], contentRating:"Teen", pages:438, words:95000, language:"English", series:null, description:"Cath is a fangirl who writes wildly popular Simon Snow fan fiction. Starting college is terrifying when her twin sister has moved on without her and the real world keeps interrupting her life online.", warnings:["Anxiety","Depression","Alcoholism","Family Dysfunction"], tropes:["Coming of Age","Slow Burn","Fish Out of Water","Identity"], tags:["Contemporary","Romance","College","Humor","Fandom","Relatable"] },
  { id:354, isbn:"9781594489501", title:"A Thousand Splendid Suns", author:"Khaled Hosseini", rating:4.8, genres:["Fiction"], contentRating:"Adult", pages:372, words:107000, language:"English", series:null, description:"The story of two women — Mariam and Laila — whose lives intersect in Kabul across three decades of war, oppression, and devastating loss. A story of survival, sacrifice, and the unbreakable bond between women.", warnings:["Domestic Violence","Sexual Assault","War","Death","Child Death","Abuse","Oppression","Violence"], tropes:["Found Family","Sacrifice","Survival","Multiple POV","Tragedy"], tags:["Historical","War","Feminist","Emotional","Inspirational","Important"] },
  { id:355, isbn:"9780399171611", title:"The Wrath and the Dawn", author:"Renee Ahdieh", rating:4.2, genres:["YA","Fantasy","Romance","Fiction"], contentRating:"Teen", pages:388, words:98000, language:"English", series:{name:"The Wrath and the Dawn",number:1,status:"Completed"}, description:"A reimagining of One Thousand and One Nights set in ancient Khorasan. Shahrzad volunteers to marry the king who has been executing his brides — and finds herself falling for a man she intended to kill.", warnings:["Death","Violence","Manipulation","War"], tropes:["Enemies to Lovers","Forbidden Love","Star-Crossed Lovers","Slow Burn"], tags:["Fantasy","Romance","Historical","Dark","Atmospheric","Diverse"] },
  { id:356, isbn:"9780679734772", title:"The House on Mango Street", author:"Sandra Cisneros", rating:4.2, genres:["Fiction","YA"], contentRating:"Teen", pages:110, words:19000, language:"English", series:null, description:"Told in a series of vignettes, this is the story of Esperanza Cordero growing up in the Latino quarter of Chicago — finding her identity, navigating poverty and desire, and searching for a place that is truly her own.", warnings:["Poverty","Racism","Sexual Assault","Domestic Violence","Strong Language"], tropes:["Coming of Age","Strong Female Lead","Social Justice","Finding Voice"], tags:["Literary","Feminist","Diverse","Poetry","Short","Social Commentary"] },
  { id:357, isbn:"9780316013680", title:"The Absolutely True Diary of a Part-Time Indian", author:"Sherman Alexie", rating:4.4, genres:["YA","Fiction"], contentRating:"Teen", pages:230, words:48000, language:"English", series:null, description:"Arnold Spirit Jr. — a rez kid nicknamed Junior — decides to transfer to the all-white high school nearby. Illustrated with his own drawings, Junior navigates two worlds and searches for hope in the most hopeless of places.", warnings:["Racism","Death","Alcoholism","Poverty","Bullying","Violence"], tropes:["Coming of Age","Social Justice","Underdog","Identity","Finding Voice"], tags:["Humor","Illustrated","Diverse","Indigenous","Dark","Important"] },
  { id:358, isbn:"9780670011100", title:"Wintergirls", author:"Laurie Halse Anderson", rating:4.0, genres:["YA","Fiction"], contentRating:"Teen", pages:278, words:52000, language:"English", series:null, description:"Lia and Cassie made a pact to be the skinniest girls in school. Now Cassie is dead, and Lia is haunted by her friend's voice as she struggles with anorexia — slowly unraveling the truth about the night Cassie called her thirty-three times.", warnings:["Eating Disorder","Death","Self-Harm","Mental Health","Suicide","Substance Abuse"], tropes:["Healing","Tragedy","Coming of Age","Mental Health Journey"], tags:["Dark","Contemporary","Important","Emotional","Mental Health","Grief"] },
  { id:359, isbn:"9780763622596", title:"Feed", author:"M.T. Anderson", rating:4.1, genres:["YA","Sci-Fi","Fiction"], contentRating:"Teen", pages:237, words:50000, language:"English", series:null, description:"In a future America, nearly everyone has a computer chip called the feed implanted in their brain that controls their entire life. When Titus meets Violet, who challenges everything he knows, his world begins to fracture.", warnings:["Death","Consumerism","Oppression","Dark Themes","Violence"], tropes:["Dystopia","Coming of Age","Tragic Hero","Social Commentary"], tags:["Sci-Fi","Dark","Satirical","Dystopia","Philosophical","Important"] },
  { id:360, isbn:"9781595141712", title:"Thirteen Reasons Why", author:"Jay Asher", rating:3.8, genres:["YA","Fiction"], contentRating:"Teen", pages:288, words:62000, language:"English", series:null, description:"Clay Jensen comes home to find a mysterious box of cassette tapes recorded by his classmate Hannah Baker, who recently took her own life. Each tape addresses one of thirteen people she says played a role in her death.", warnings:["Suicide","Sexual Assault","Bullying","Depression","Death","Self-Harm","Mental Health"], tropes:["Mystery","Dual POV","Tragedy","Social Commentary"], tags:["Dark","Contemporary","Important","Emotional","Controversial","Mental Health"] },
  { id:361, isbn:"9780375822735", title:"The City of Ember", author:"Jeanne DuPrau", rating:4.1, genres:["YA","Sci-Fi","Fiction"], contentRating:"Teen", pages:270, words:66000, language:"English", series:{name:"The Book of Ember",number:1,status:"Completed"}, description:"Ember is a city of perpetual darkness, kept alive by its massive generator and carefully rationed supplies. When Lina and Doon discover that the city is running out of resources, they follow clues to find a way out.", warnings:["Peril","Death","Dark Themes","Scarcity"], tropes:["Chosen One","Quest","Survival","Coming of Age","Mystery"], tags:["Sci-Fi","Adventure","Dystopia","Kids","Dark","Mystery"] },
  { id:362, isbn:"9781681195087", title:"A Curse So Dark and Lonely", author:"Brigid Kemmerer", rating:4.1, genres:["YA","Fantasy","Romance","Fiction"], contentRating:"Teen", pages:496, words:123000, language:"English", series:{name:"A Curse So Dark and Lonely",number:1,status:"Completed"}, description:"Prince Rhen of Emberfall is trapped in an endless curse that transforms him into a monster. When his guard Harper accidentally pulls a girl from Washington DC into their world, she may be the only one who can break it.", warnings:["Violence","Death","Disability","Manipulation","Dark Themes","War"], tropes:["Beauty and the Beast","Forbidden Love","Slow Burn","Strong Female Lead"], tags:["Fantasy","Romance","Retelling","Dark","Adventure","Action"] },
  { id:363, isbn:"9781250056412", title:"Crooked Kingdom", author:"Leigh Bardugo", rating:4.8, genres:["YA","Fantasy","Fiction"], contentRating:"Teen", pages:536, words:153000, language:"English", series:{name:"Six of Crows",number:2,status:"Completed"}, description:"After the Ice Court heist, Kaz Brekker and his crew are back in Ketterdam — but someone has set a trap. With each of their lives in danger, Kaz must plan the most daring scheme of all to save everything he's built.", warnings:["Violence","Death","Trafficking","Addiction","PTSD","Strong Language","Torture"], tropes:["Found Family","Heist","Enemies to Lovers","Morally Grey Characters","Slow Burn"], tags:["Adventure","Romance","Action","Dark","Humor","Epic"] },
  { id:364, isbn:"9781565129764", title:"In the Time of the Butterflies", author:"Julia Alvarez", rating:4.5, genres:["Fiction","Historical Fiction","YA"], contentRating:"Teen", pages:325, words:93000, language:"English", series:null, description:"The story of the four Mirabal sisters who became symbols of resistance against the Trujillo dictatorship in the Dominican Republic. Based on real events, it blends their distinct voices into a powerful story of courage and sacrifice.", warnings:["Violence","Death","Torture","Sexual Assault","Political Violence","Oppression"], tropes:["Strong Female Lead","Multiple POV","Tragedy","Social Justice"], tags:["Historical","Political","Feminist","Inspirational","Dark","Family"] },
  { id:365, isbn:"9780525423270", title:"Anna and the French Kiss", author:"Stephanie Perkins", rating:4.0, genres:["YA","Romance","Fiction"], contentRating:"Teen", pages:372, words:84000, language:"English", series:{name:"Anna and the French Kiss",number:1,status:"Completed"}, description:"Anna is sent to an American boarding school in Paris for her senior year and is furious — until she meets Étienne St. Clair. He is perfect. And he has a girlfriend. And an even more complicated situation than that.", warnings:["Cheating","Mild Sexual Content","Parental Issues"], tropes:["Slow Burn","Forbidden Love","Best Friends to Lovers","Paris Setting"], tags:["Romance","Contemporary","Paris","School Setting","Humor","Heartwarming"] },
  { id:366, isbn:"9780763645762", title:"The Knife of Never Letting Go", author:"Patrick Ness", rating:4.3, genres:["YA","Sci-Fi","Fiction"], contentRating:"Teen", pages:479, words:116000, language:"English", series:{name:"Chaos Walking",number:1,status:"Completed"}, description:"Todd lives in a world where everyone can hear everyone else's thoughts — a constant cacophony called Noise. When he discovers a patch of silence in the swamp, it starts a chain of events that will change his world forever.", warnings:["Violence","Death","Genocide","Animal Death","Oppression","Dark Themes"], tropes:["Road Trip","Coming of Age","Dual POV","Survival","Revolution"], tags:["Sci-Fi","Action","Dark","Adventure","Philosophical","Dystopia"] },
  { id:367, isbn:"9781596430266", title:"How I Live Now", author:"Meg Rosoff", rating:4.0, genres:["YA","Fiction","Sci-Fi"], contentRating:"Teen", pages:194, words:44000, language:"English", series:null, description:"Fifteen-year-old Daisy is sent from New York to stay with cousins in rural England. Within days of her arrival, World War III begins. As the country is occupied, Daisy and her cousins must survive by any means necessary.", warnings:["War","Death","Violence","Sexual Content","Starvation","Trauma","Incest Themes"], tropes:["Survival","Star-Crossed Lovers","Coming of Age","War"], tags:["Sci-Fi","Dark","War","Romance","Dystopia","Short"] },
  { id:368, isbn:"9780689852237", title:"The House of the Scorpion", author:"Nancy Farmer", rating:4.3, genres:["YA","Sci-Fi","Fiction"], contentRating:"Teen", pages:380, words:94000, language:"English", series:{name:"Matteo Alacrán",number:1,status:"Completed"}, description:"Matteo Alacrán is a clone of El Patrón, the 140-year-old ruler of a country between the United States and Mexico. As Matt grows up, he discovers the terrifying purpose for which he was created.", warnings:["Death","Violence","Slavery","Oppression","Dark Themes","Identity Crisis"], tropes:["Coming of Age","Identity","Dystopia","Dark Mentor","Moral Dilemma"], tags:["Sci-Fi","Dark","Adventure","Philosophical","Dystopia","Action"] },
  { id:369, isbn:"9780156030083", title:"Flowers for Algernon", author:"Daniel Keyes", rating:4.5, genres:["Fiction","Sci-Fi","Classics"], contentRating:"Adult", pages:311, words:79000, language:"English", series:null, description:"Charlie Gordon is a thirty-two-year-old man with an intellectual disability who undergoes an experimental surgery to triple his IQ. Told through his journal entries, we watch him become extraordinarily intelligent — and then begin to lose it all.", warnings:["Ableism","Sexual Content","Mental Health","Tragedy","Isolation"], tropes:["Transformation","Tragedy","Coming of Age","Anti-Hero"], tags:["Classic","Sci-Fi","Emotional","Philosophical","Dark","Literary"] },
  { id:370, isbn:"9780439023498", title:"Catching Fire", author:"Suzanne Collins", rating:4.5, genres:["YA","Sci-Fi","Fiction"], contentRating:"Teen", pages:391, words:101000, language:"English", series:{name:"The Hunger Games",number:2,status:"Completed"}, description:"Katniss Everdeen has survived the Hunger Games, but the Capitol is angry. As she and Peeta tour the districts, rebellion is stirring — and the Quarter Quell brings a shocking twist: previous victors must return to the arena.", warnings:["Violence","Death","Intense Violence","Oppressive Government","Trauma","PTSD","War"], tropes:["Strong Female Lead","Love Triangle","Revolution","Survival"], tags:["Action","Adventure","Dark","Romance","Dystopia","Thrilling"] },
  { id:371, isbn:"9780375829871", title:"The Chocolate War", author:"Robert Cormier", rating:4.0, genres:["YA","Fiction"], contentRating:"Teen", pages:253, words:58000, language:"English", series:null, description:"Jerry Renault refuses to sell chocolates for his Catholic school's annual fundraiser. His small act of defiance sets him against the secret society that secretly runs the school, with devastating consequences.", warnings:["Violence","Bullying","Manipulation","Psychological Abuse","Oppression","Dark Themes"], tropes:["Underdog","Tragedy","Power Corruption","Coming of Age"], tags:["Dark","Classic","Philosophical","School Setting","Important","Social Commentary"] },
  { id:372, isbn:"9781534400627", title:"Are You There God? It's Me, Margaret", author:"Judy Blume", rating:4.3, genres:["YA","Fiction"], contentRating:"Teen", pages:149, words:32000, language:"English", series:null, description:"Eleven-year-old Margaret Simon has just moved to the suburbs. She talks to God regularly as she navigates the awkward milestones of growing up — waiting for her period, dealing with boys, and figuring out what religion means to her.", warnings:["Religious Uncertainty","Puberty Discussion","Mild Sexual Content"], tropes:["Coming of Age","Identity","Friendship","Outcast"], tags:["Classic","Contemporary","Humor","Relatable","Coming of Age","Short"] },
  { id:373, isbn:"9780062662804", title:"The Poet X", author:"Elizabeth Acevedo", rating:4.5, genres:["YA","Fiction"], contentRating:"Teen", pages:357, words:29000, language:"English", series:null, description:"Xiomara Batista feels invisible — except when she is onstage at the slam poetry club. As she finds her voice and falls in love, she must confront her devout mother, who fears the fire in her daughter's words.", warnings:["Religious Conflict","Domestic Tension","Sexual Content","Bullying"], tropes:["Strong Female Lead","Coming of Age","Identity","Finding Voice","Forbidden Love"], tags:["Poetry","Verse Novel","Diverse","Coming of Age","Romance","Important"] },
  { id:374, isbn:"9781481463348", title:"All American Boys", author:"Jason Reynolds & Brendan Kiely", rating:4.4, genres:["YA","Fiction"], contentRating:"Teen", pages:316, words:68000, language:"English", series:null, description:"Rashad is beaten by a police officer outside a convenience store. Quinn witnesses it. Both boys must decide what to do with what they saw — told in alternating chapters that explore race, police violence, and the cost of speaking up.", warnings:["Police Violence","Racism","Violence","Strong Language","Death"], tropes:["Dual POV","Social Justice","Coming of Age","Identity"], tags:["Contemporary","Social Commentary","Racism","Important","Emotional","Dark"] },
  { id:375, isbn:"9780385755894", title:"All the Bright Places", author:"Jennifer Niven", rating:4.2, genres:["YA","Fiction","Romance"], contentRating:"Teen", pages:378, words:86000, language:"English", series:null, description:"Theodore Finch and Violet Markey meet on the ledge of a school bell tower — both wondering whether they should jump. As they embark on a school project to explore Indiana, they fall in love with each other's broken parts.", warnings:["Suicide","Mental Health","Death","Violence","Emotional Abuse","Self-Harm"], tropes:["Coming of Age","Star-Crossed Lovers","Tragedy","Healing"], tags:["Contemporary","Romance","Dark","Mental Health","Emotional","Important"] },
  { id:376, isbn:"9780735224292", title:"Little Fires Everywhere", author:"Celeste Ng", rating:4.3, genres:["Fiction"], contentRating:"Adult", pages:338, words:97000, language:"English", series:null, description:"In the placid suburb of Shaker Heights, the lives of two families intersect and eventually explode. Mia Warren and her daughter Pearl rent from the Richardsons, whose perfect world is about to be consumed by questions of race, class, and secrets.", warnings:["Racism","Abortion","Adoption Themes","Class Issues","Fire","Mental Health"], tropes:["Multiple POV","Dark Secrets","Social Commentary","Family Drama"], tags:["Contemporary","Literary","Social Commentary","Family","Dark","Important"] },
  { id:377, isbn:"9781481449359", title:"The Way I Used to Be", author:"Amber Smith", rating:4.1, genres:["YA","Fiction"], contentRating:"Teen", pages:384, words:82000, language:"English", series:null, description:"Eden was the girl who did everything right — until the night a trusted family friend assaulted her. Told over four years of high school, this novel follows Eden as she falls apart and slowly, painfully begins to reclaim herself.", warnings:["Sexual Assault","Self-Harm","Substance Abuse","Depression","Trauma","Strong Language"], tropes:["Healing","Strong Female Lead","Coming of Age","Tragedy"], tags:["Contemporary","Dark","Important","Emotional","Recovery","Feminist"] },
  { id:378, isbn:"9780316534802", title:"Last Night at the Telegraph Club", author:"Malinda Lo", rating:4.4, genres:["YA","Historical Fiction","Romance","Fiction"], contentRating:"Teen", pages:416, words:106000, language:"English", series:null, description:"In 1954 San Francisco, seventeen-year-old Lily Hu discovers a love she must keep secret — for Kath Miller, a girl she meets at a lesbian nightclub. Set against McCarthyism and the deportation campaigns targeting Chinese Americans.", warnings:["Homophobia","Racism","Death","Violence","Historical Persecution"], tropes:["Forbidden Love","Coming of Age","Identity","Star-Crossed Lovers"], tags:["LGBTQ+","Historical","Romance","Diverse","Dark","Important"] },
  { id:379, isbn:"9780525552994", title:"Darius the Great Is Not Okay", author:"Adib Khorram", rating:4.3, genres:["YA","Fiction"], contentRating:"Teen", pages:314, words:69000, language:"English", series:{name:"Darius the Great",number:1,status:"Completed"}, description:"Darius Kellner is half-Persian, clinically depressed, and has never felt like he belonged anywhere. When his family travels to Iran to see his dying grandfather, he meets Sohrab — his first real friend — and begins to find himself.", warnings:["Depression","Death","Mental Health","Racism","Illness"], tropes:["Unlikely Friendship","Coming of Age","Identity","Healing"], tags:["Contemporary","Diverse","LGBTQ+","Emotional","Family","Heartwarming"] },
  { id:380, isbn:"9780735224407", title:"The Sky Is Everywhere", author:"Jandy Nelson", rating:4.3, genres:["YA","Fiction","Romance"], contentRating:"Teen", pages:275, words:68000, language:"English", series:null, description:"Lennie Walker's sister Bailey has just died suddenly, and Lennie is falling apart. When she meets the gorgeous new boy in town at the same time as she finds herself drawn to her dead sister's boyfriend, she is pulled in two impossible directions.", warnings:["Death","Grief","Guilt","Sexual Content","Strong Language"], tropes:["Grief","Love Triangle","Healing","Coming of Age"], tags:["Romance","Emotional","Grief","Contemporary","Heartbreaking","Family"] },
  { id:381, isbn:"9780316462006", title:"The Astonishing Color of After", author:"Emily X.R. Pan", rating:4.3, genres:["YA","Fantasy","Fiction"], contentRating:"Teen", pages:432, words:103000, language:"English", series:null, description:"After her mother commits suicide, Leigh believes she has turned into a bird. Leigh flies to Taiwan with her father to meet her maternal grandparents for the first time, searching for memories and answers about who her mother really was.", warnings:["Suicide","Death","Depression","Grief","Racism","Mental Health"], tropes:["Healing","Coming of Age","Magic Realism","Identity"], tags:["Emotional","Fantasy","Diverse","Grief","Family","Important"] },
  { id:382, isbn:"9780553524055", title:"The Serpent King", author:"Jeff Zentner", rating:4.3, genres:["YA","Fiction"], contentRating:"Teen", pages:368, words:87000, language:"English", series:null, description:"Three misfits in a small Tennessee town — Dill, Lydia, and Travis — navigate a world with no clear future ahead of them. Set during their senior year, it is a story about choosing who you want to be and surviving the choosing.", warnings:["Death","Religious Trauma","Violence","Poverty","Strong Language","Grief"], tropes:["Found Family","Coming of Age","Tragedy","Multiple POV"], tags:["Contemporary","Dark","Emotional","Friendship","Southern","Important"] },
  { id:383, isbn:"9780593128480", title:"A Deadly Education", author:"Naomi Novik", rating:4.2, genres:["Fantasy","Fiction","YA"], contentRating:"Teen", pages:313, words:85000, language:"English", series:{name:"The Scholomance",number:1,status:"Completed"}, description:"El Higgins is a scholarship student at the Scholomance, a school for wizards with no teachers and no rules — only monsters that kill students for sport. She has the power to destroy the world. She has no friends. Until now.", warnings:["Violence","Death","Dark Themes","Body Horror"], tropes:["Unlikely Friendship","Coming of Age","Strong Female Lead","School Setting","Enemies to Lovers"], tags:["Fantasy","Dark","Humor","Magic","School Setting","Action"] },
  { id:384, isbn:"9780525422068", title:"We Are Okay", author:"Nina LaCour", rating:4.1, genres:["YA","Fiction","Romance"], contentRating:"Teen", pages:234, words:45000, language:"English", series:null, description:"Marin left everything behind — her grandfather, her home, her best friend Mabel — when she moved across the country for college. Now Mabel is coming to visit, and the secrets Marin has been running from can no longer be avoided.", warnings:["Death","Grief","Loneliness","Guilt","Mild Sexual Content"], tropes:["Coming of Age","Healing","Forbidden Love","Mystery"], tags:["LGBTQ+","Contemporary","Emotional","Quiet","Grief","Short"] },
  { id:385, isbn:"9780062473233", title:"American Street", author:"Ibi Zoboi", rating:4.1, genres:["YA","Fiction"], contentRating:"Teen", pages:336, words:72000, language:"English", series:null, description:"Fabiola Toussaint arrives in Detroit from Haiti with her mother — but her mother is detained at immigration and Fabiola must navigate her new country alone, staying with cousins who are dangerously entangled in gang activity.", warnings:["Violence","Death","Drug Use","Immigration","Gang Violence","Strong Language"], tropes:["Fish Out of Water","Coming of Age","Identity","Family Drama"], tags:["Contemporary","Diverse","Dark","Immigration","Family","Social Commentary"] },
  { id:386, isbn:"9781250135025", title:"Carry On", author:"Rainbow Rowell", rating:4.3, genres:["YA","Fantasy","Romance","Fiction"], contentRating:"Teen", pages:522, words:138000, language:"English", series:{name:"Simon Snow",number:1,status:"Completed"}, description:"Simon Snow is the worst Chosen One who's ever been chosen. His roommate Baz is a vampire and probably his mortal enemy. And as their final year at Watford School of Magicks begins, neither of them is prepared for what's coming.", warnings:["Violence","Death","Bullying","Strong Language","Dark Magic"], tropes:["Chosen One","Enemies to Lovers","Found Family","School Setting","Coming of Age"], tags:["Fantasy","LGBTQ+","Romance","Humor","School Setting","Magic"] },
  { id:387, isbn:"9781619635197", title:"A Court of Mist and Fury", author:"Sarah J. Maas", rating:4.8, genres:["Fantasy","Romance","Fiction"], contentRating:"Adult", pages:626, words:185000, language:"English", series:{name:"A Court of Thorns and Roses",number:2,status:"Ongoing"}, description:"Feyre survived the trials of Prythian. Now she is going to pieces in the Court of Spring. When Rhysand invokes an old bargain to take her away one week a month, she discovers a darkness she never anticipated — and a world that changes everything.", warnings:["Violence","Death","PTSD","Sexual Content","Emotional Abuse","Trauma","Dark Themes"], tropes:["Slow Burn","Enemies to Lovers","Found Family","Strong Female Lead","Multiple POV"], tags:["Fantasy","Romance","Dark","Epic","Emotional","Adult"] },
  { id:388, isbn:"9781501110351", title:"November 9", author:"Colleen Hoover", rating:4.2, genres:["Fiction","Romance"], contentRating:"Adult", pages:310, words:74000, language:"English", series:null, description:"Ben and Fallon meet by chance on November 9th — the day Fallon is leaving for New York. They agree to meet again on the same date every November 9th for five years. But Ben is hiding a secret that could destroy everything.", warnings:["Fire","Trauma","Scars","Manipulation","Deception","Strong Language","Sexual Content"], tropes:["Slow Burn","Second Chance Romance","Dark Secret","Enemies to Lovers"], tags:["Romance","Contemporary","Dark","Emotional","Suspense","Adult"] },
  { id:389, isbn:"9781476753188", title:"Ugly Love", author:"Colleen Hoover", rating:4.0, genres:["Fiction","Romance"], contentRating:"Adult", pages:332, words:73000, language:"English", series:null, description:"Tate Collins moves in with her brother and meets his brooding pilot neighbor Miles Archer. Miles agrees to a no-strings arrangement. But strings are forming anyway — and Miles is carrying a secret pain that will shatter everything.", warnings:["Trauma","Grief","Child Death","Sexual Content","Strong Language","Emotional Manipulation"], tropes:["Forbidden Love","Dark Romance","Slow Burn","Second Chance","Tragic Backstory"], tags:["Romance","Contemporary","Dark","Emotional","Adult","Heartbreaking"] },
  { id:390, isbn:"9781728258386", title:"Reminders of Him", author:"Colleen Hoover", rating:4.3, genres:["Fiction","Romance"], contentRating:"Adult", pages:335, words:79000, language:"English", series:null, description:"Kenna Rowan returns to the town where she grew up after serving time in prison for a tragic accident that killed her boyfriend. She wants desperately to reconnect with her young daughter — but faces fierce resistance from the family raising her.", warnings:["Death","Grief","Prison","Parental Separation","Strong Language","Sexual Content","Substance Abuse"], tropes:["Second Chance Romance","Tragedy","Healing","Forbidden Love"], tags:["Romance","Contemporary","Emotional","Dark","Heartbreaking","Adult"] },
  { id:391, isbn:"9780062820259", title:"Felix Ever After", author:"Kacen Callender", rating:4.3, genres:["YA","Fiction","Romance"], contentRating:"Teen", pages:368, words:91000, language:"English", series:null, description:"Felix Love has never been in love — something he is determined to change before his senior year. When he discovers that someone has outed him and posted old photos to mock him, he plans revenge that spirals into something unexpected.", warnings:["Racism","Homophobia","Transphobia","Bullying","Strong Language","Parental Rejection"], tropes:["Coming of Age","Identity","Slow Burn","Found Family"], tags:["LGBTQ+","Contemporary","Romance","Diverse","School Setting","Important"] },
  { id:392, isbn:"9781481481977", title:"Dry", author:"Neal Shusterman & Jarrod Shusterman", rating:4.2, genres:["YA","Sci-Fi","Fiction"], contentRating:"Teen", pages:390, words:96000, language:"English", series:null, description:"The taps run dry in Southern California with no warning. Within days, neighborhoods turn deadly as desperation takes over. Alyssa must protect her little brother and find water — and trust her morality against impossible pressure.", warnings:["Violence","Death","Child Peril","Dehydration","Moral Dilemma","Dark Themes"], tropes:["Survival","Road Trip","Moral Dilemma","Dystopia"], tags:["Sci-Fi","Dark","Thriller","Adventure","Dystopia","Gripping"] },
  { id:393, isbn:"9780316399616", title:"The First Fifteen Lives of Harry August", author:"Claire North", rating:4.5, genres:["Fiction","Sci-Fi","Fantasy"], contentRating:"Adult", pages:405, words:118000, language:"English", series:null, description:"Harry August lives and dies the same life over and over, born in 1919 with every memory intact. He is not the only one. But now a message has come back from the future — the world is ending, and it is ending faster each time.", warnings:["Violence","Death","Torture","War","Dark Themes"], tropes:["Time Loop","Multiple Lives","Mystery","Philosophical"], tags:["Sci-Fi","Literary","Dark","Time Travel","Thriller","Philosophical"] },
  { id:394, isbn:"9780670017324", title:"The Crown's Game", author:"Evelyn Skye", rating:4.0, genres:["YA","Fantasy","Historical Fiction","Fiction"], contentRating:"Teen", pages:422, words:106000, language:"English", series:{name:"The Crown's Game",number:1,status:"Completed"}, description:"In Imperial Russia, only one enchanter can serve the tsar at a time — and when two are discovered, one must die. Vika and Nikolai must compete in a magical competition with their lives as the prize, while feelings complicate the stakes.", warnings:["Death","Violence","Manipulation","Dark Magic"], tropes:["Enemies to Lovers","Star-Crossed Lovers","Slow Burn","Competition"], tags:["Fantasy","Historical","Romance","Dark","Russia","Atmospheric"] },
  { id:395, isbn:"9780553523966", title:"The Stars Beneath Our Feet", author:"David Barclay Moore", rating:4.2, genres:["YA","Fiction"], contentRating:"Teen", pages:293, words:63000, language:"English", series:null, description:"Twelve-year-old Lolly lives in Harlem and is grieving his older brother's death in a gang dispute. When bags of LEGO bricks arrive from his mother's partner, Lolly begins building enormous structures — and finds an unexpected path through grief.", warnings:["Death","Gang Violence","Racism","Grief","Homophobia","Violence"], tropes:["Coming of Age","Healing","Found Family","Underdog"], tags:["Contemporary","Diverse","Dark","Family","Emotional","Important"] },
  { id:396, isbn:"9781503937758", title:"Never Never", author:"Colleen Hoover & Tarryn Fisher", rating:3.8, genres:["YA","Mystery","Romance","Fiction"], contentRating:"Teen", pages:170, words:38000, language:"English", series:{name:"Never Never",number:1,status:"Completed"}, description:"Charlie Wynwood and Silas Nash wake up with no memories of who they are — or each other. As they piece together their lives, they discover they were in love and that something dark is behind their amnesia.", warnings:["Mystery","Dark Themes","Violence","Mild Sexual Content"], tropes:["Amnesia","Mystery","Star-Crossed Lovers","Dual POV"], tags:["Mystery","Romance","Thriller","Suspense","Short","Unique Format"] },
  { id:397, isbn:"9781534406513", title:"The Wicked King", author:"Holly Black", rating:4.5, genres:["YA","Fantasy","Fiction"], contentRating:"Teen", pages:336, words:89000, language:"English", series:{name:"The Folk of the Air",number:2,status:"Completed"}, description:"Jude has tricked her way into power in the treacherous Court of Faerie, controlling the High King from the shadows. But enemies are circling, and Cardan — beautiful, unpredictable, and potentially in love with her — may be her undoing.", warnings:["Violence","Death","Manipulation","Dark Themes","Strong Language","War"], tropes:["Enemies to Lovers","Political Intrigue","Strong Female Lead","Slow Burn","Morally Grey Characters"], tags:["Fantasy","Romance","Dark","Action","Adventure","Epic"] },
  { id:398, isbn:"9781616954505", title:"More Happy Than Not", author:"Adam Silvera", rating:4.2, genres:["YA","Sci-Fi","Fiction"], contentRating:"Teen", pages:295, words:67000, language:"English", series:null, description:"In a near-future Bronx where a company offers a procedure to forget painful memories, Aaron Soto considers erasing his attraction to his new best friend — in a story about identity, love, and whether happiness is worth the price of forgetting.", warnings:["Death","Suicide","Homophobia","Violence","Gang Violence","Mental Health","Strong Language"], tropes:["Coming of Age","Identity","Tragedy","Social Commentary"], tags:["LGBTQ+","Sci-Fi","Dark","Contemporary","Important","Emotional"] },
  { id:399, isbn:"9781616956929", title:"History Is All You Left Me", author:"Adam Silvera", rating:4.2, genres:["YA","Fiction","Romance"], contentRating:"Teen", pages:293, words:64000, language:"English", series:null, description:"Griffin's first love Theo is dead. As Griffin mourns, he is pulled toward Theo's new boyfriend Jackson — the last person to have known Theo. Told through alternating timelines, this is a story about love, loss, and what we leave behind.", warnings:["Death","Grief","OCD","Mental Health","Guilt","Strong Language"], tropes:["Dual Timeline","Coming of Age","Tragedy","Healing","Second Chance"], tags:["LGBTQ+","Contemporary","Emotional","Grief","Heartbreaking","Romance"] },
  { id:400, isbn:"9780307274427", title:"Giovanni's Room", author:"James Baldwin", rating:4.4, genres:["Fiction","Classics","Romance"], contentRating:"Adult", pages:159, words:44000, language:"English", series:null, description:"An American man in 1950s Paris becomes entangled in a passionate and doomed love affair with an Italian bartender named Giovanni — while his fiancée waits in Spain. A novel about desire, identity, shame, and the lies we tell ourselves.", warnings:["Homophobia","Death","Suicide","Sexual Content","Shame","Dark Themes"], tropes:["Forbidden Love","Tragedy","Identity","Unreliable Narrator"], tags:["Classic","LGBTQ+","Literary","Dark","Historical","Philosophical"] },
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
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  const searchRef = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  useEffect(() => {
    if (open && searchRef.current && !window.matchMedia("(hover: none)").matches) searchRef.current.focus();
  }, [open]);
  const filtered = search.trim() ? options.filter(o => o.toLowerCase().includes(search.toLowerCase())) : options;
  return (
    <div ref={ref} style={{ position: "relative", marginBottom: "8px" }}>
      {label && <div style={{ fontSize: "11px", fontWeight: 700, color: C.copper, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>{label}</div>}
      <div onClick={() => { setOpen(o => !o); setSearch(""); }} style={{
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
          marginTop: "4px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        }}>
          <div style={{ padding: "6px 8px", borderBottom: "1px solid rgba(232,220,203,0.1)", position: "sticky", top: 0, background: "#2B1E2F", zIndex: 1 }}>
            <input
              ref={searchRef}
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              style={{ width: "100%", background: "rgba(43,30,47,0.8)", border: "1px solid rgba(194,122,58,0.25)", borderRadius: "4px", padding: "5px 8px", color: C.cream, fontSize: "12px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ maxHeight: "180px", overflowY: "auto" }}>
            {filtered.length === 0 && (
              <div style={{ padding: "10px 12px", fontSize: "12px", color: "rgba(232,220,203,0.4)", textAlign: "center" }}>No results</div>
            )}
            {filtered.map(opt => (
              <div key={opt} onMouseDown={e => { e.preventDefault(); onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]); }} style={{
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
                  flexShrink: 0,
                }}>{selected.includes(opt) ? "✓" : ""}</span>
                {opt}
              </div>
            ))}
          </div>
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

// ─── Account Modal ───
const AccountModal = ({ user, username, usernameInput, setUsernameInput, usernameError, usernameSaved, saveUsername, showChangePassword, setShowChangePassword, newPassword, setNewPassword, passwordMsg, changePassword, shelves, finishedDates, prefExWarnings, prefExTropes, prefExTags, onClose, onOpenProfile }) => {
  const [tab, setTab] = useState("profile");
  const thisYear = new Date().getFullYear();
  const booksThisYear = Object.entries(finishedDates || {}).filter(([,d]) => new Date(d).getFullYear() === thisYear).length;

  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(6px)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background:"linear-gradient(160deg,#2B1E2F,#1a1220)",borderRadius:"20px",maxWidth:"480px",width:"100%",maxHeight:"88vh",overflowY:"auto",border:"1px solid rgba(194,122,58,0.3)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"24px 28px 0" }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif",color:C.cream,margin:0,fontSize:"21px" }}>My Account</h2>
          <button onClick={onClose} style={{ background:"none",border:"none",color:C.cream,fontSize:"20px",cursor:"pointer" }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex",gap:"6px",padding:"16px 28px 0" }}>
          {[["profile","👤 My Profile"],["settings","⚙️ Settings"]].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding:"7px 18px",background:tab===t?C.copper:"rgba(232,220,203,0.06)",border:`1px solid ${tab===t?C.copper:"rgba(232,220,203,0.12)"}`,borderRadius:"8px",color:tab===t?"#fff":C.cream,fontSize:"12px",fontWeight:700,cursor:"pointer" }}>{label}</button>
          ))}
        </div>

        <div style={{ padding:"20px 28px 28px" }}>
          {tab === "profile" && (
            <div>
              {/* Quick profile card */}
              <div style={{ padding:"14px",background:"rgba(194,122,58,0.06)",borderRadius:"12px",border:"1px solid rgba(194,122,58,0.15)",marginBottom:"16px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:"12px",flexWrap:"wrap" }}>
                <div>
                  <div style={{ fontSize:"11px",fontWeight:700,color:C.copper,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"4px" }}>Your Profile</div>
                  <div style={{ color:C.cream,fontSize:"14px",fontWeight:600 }}>{username ? `@${username}` : "No username set"}</div>
                  <div style={{ color:"rgba(232,220,203,0.4)",fontSize:"11px",marginTop:"2px" }}>{booksThisYear} books read in {thisYear}</div>
                </div>
                <button onClick={onOpenProfile} style={{ padding:"8px 16px",background:`linear-gradient(135deg,${C.copper},#A86830)`,border:"none",borderRadius:"8px",color:"#fff",fontSize:"12px",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap" }}>View Full Profile</button>
              </div>

              {/* Shelf overview grid */}
              <div style={{ marginBottom:"16px" }}>
                <div style={{ fontSize:"11px",fontWeight:700,color:C.copper,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"10px" }}>Shelf Overview</div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px" }}>
                  {PROFILE_SHELVES.map(({ key, emoji, color }) => (
                    <div key={key} style={{ padding:"8px 12px",background:"rgba(232,220,203,0.03)",borderRadius:"8px",border:"1px solid rgba(232,220,203,0.06)",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                      <span style={{ fontSize:"11px",color,fontWeight:600 }}>{emoji} {key === "Desert Island 5" ? "Island 5" : key === "Lend & Borrow" ? "Lend/Borrow" : key}</span>
                      <span style={{ fontSize:"12px",color:"rgba(232,220,203,0.5)",fontWeight:700 }}>{(shelves[key]||[]).length}{key==="Desert Island 5"?"/5":""}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exclusions preview */}
              <div style={{ marginBottom:"16px",padding:"14px",background:"rgba(232,220,203,0.03)",borderRadius:"12px",border:"1px solid rgba(232,220,203,0.08)" }}>
                <div style={{ fontSize:"11px",fontWeight:700,color:C.copper,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"8px" }}>Default Exclusions</div>
                {prefExWarnings.length > 0 || prefExTropes.length > 0 || prefExTags.length > 0 ? (
                  <div style={{ display:"flex",flexWrap:"wrap",gap:"5px" }}>
                    {[...prefExWarnings, ...prefExTropes, ...prefExTags].slice(0, 8).map(v => <Badge key={v} text={v} color="#C27A3A" border="1px solid rgba(139,58,58,0.35)" />)}
                    {(prefExWarnings.length + prefExTropes.length + prefExTags.length) > 8 && <span style={{ fontSize:"11px",color:"rgba(232,220,203,0.4)",alignSelf:"center" }}>+{(prefExWarnings.length + prefExTropes.length + prefExTags.length) - 8} more</span>}
                  </div>
                ) : (
                  <span style={{ color:"rgba(232,220,203,0.35)",fontSize:"12px",fontStyle:"italic" }}>Set these in your full profile →</span>
                )}
              </div>
              <button onClick={onOpenProfile} style={{ width:"100%",padding:"11px",background:`linear-gradient(135deg,${C.copper},#A86830)`,border:"none",borderRadius:"10px",color:"#fff",fontSize:"13px",fontWeight:700,cursor:"pointer" }}>Open My Full Profile</button>
            </div>
          )}

          {tab === "settings" && (
            <div>
              <div style={{ marginBottom:"20px",padding:"14px",background:"rgba(232,220,203,0.03)",borderRadius:"12px",border:"1px solid rgba(232,220,203,0.08)" }}>
                <div style={{ fontSize:"11px",fontWeight:700,color:C.copper,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"6px" }}>Email</div>
                <div style={{ color:C.cream,fontSize:"14px" }}>{user?.email}</div>
              </div>
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
                <div style={{ color:"rgba(232,220,203,0.35)",fontSize:"11px",marginTop:"6px" }}>Friends find you by this username. Lowercase letters, numbers, and underscores only.</div>
              </div>
              <div style={{ padding:"14px",background:"rgba(232,220,203,0.03)",borderRadius:"12px",border:"1px solid rgba(232,220,203,0.08)" }}>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Profile Modal ───
const PROFILE_COMING_SOON = [
  { emoji: "🧠", label: "Reading Personality Type" },
  { emoji: "✍️", label: "Favorite Authors" },
  { emoji: "⭐", label: "Reviews & Ratings" },
  { emoji: "💬", label: "Quotes & Highlights" },
  { emoji: "🔥", label: "Total Campfire Hours" },
  { emoji: "🪵", label: "Sessions Attended" },
  { emoji: "🏅", label: "Badges & Milestones" },
  { emoji: "📅", label: "Reading Anniversary" },
  { emoji: "🔁", label: "Most Re-read Book" },
  { emoji: "🌳", label: "Bookshelf of My Childhood" },
];

const PROFILE_SHELVES = [
  { key: "Currently Reading", emoji: "📖", color: "#35605A" },
  { key: "Want to Read",      emoji: "🎯", color: "#C27A3A" },
  { key: "Finished",          emoji: "✅", color: "#5BA85B" },
  { key: "Desert Island 5",   emoji: "🏝️", color: "#C27A3A" },
  { key: "DNF",               emoji: "🚫", color: "#8B3A3A" },
  { key: "Re-read",           emoji: "🔁", color: "#35605A" },
  { key: "Lend & Borrow",     emoji: "🤝", color: "#C27A3A" },
];

const ProfileModal = ({ isOwn, profileUser, ownShelves, finishedDates, prefExWarnings, prefExTropes, prefExTags, saveExclusionPrefs, onClose, onBookClick }) => {
  const [loading, setLoading] = useState(!isOwn);
  const [friendShelves, setFriendShelves] = useState({});
  const [friendExWarnings, setFriendExWarnings] = useState([]);
  const [friendExTropes, setFriendExTropes] = useState([]);
  const [friendExTags, setFriendExTags] = useState([]);
  const [tbrPick, setTbrPick] = useState(null);
  const [editingPrefs, setEditingPrefs] = useState(false);
  const [tempWarnings, setTempWarnings] = useState([]);
  const [tempTropes, setTempTropes] = useState([]);
  const [tempTags, setTempTags] = useState([]);

  useEffect(() => {
    if (isOwn || !profileUser?.id) return;
    (async () => {
      setLoading(true);
      try {
        const [{ data: shData }, { data: prof }] = await Promise.all([
          supabase.from("user_shelves").select("shelf_name, book_ids").eq("user_id", profileUser.id),
          supabase.from("profiles").select("pref_ex_warnings, pref_ex_tropes, pref_ex_tags").eq("id", profileUser.id).maybeSingle(),
        ]);
        if (shData) {
          const loaded = {};
          shData.forEach(r => { loaded[r.shelf_name] = r.book_ids || []; });
          setFriendShelves(loaded);
        }
        if (prof?.pref_ex_warnings) try { setFriendExWarnings(JSON.parse(prof.pref_ex_warnings)); } catch {}
        if (prof?.pref_ex_tropes) try { setFriendExTropes(JSON.parse(prof.pref_ex_tropes)); } catch {}
        if (prof?.pref_ex_tags) try { setFriendExTags(JSON.parse(prof.pref_ex_tags)); } catch {}
      } finally { setLoading(false); }
    })();
  }, [isOwn, profileUser?.id]);

  const activeShelves = isOwn ? ownShelves : friendShelves;
  const hasAnyExclusions = prefExWarnings.length > 0 || prefExTropes.length > 0 || prefExTags.length > 0;
  const thisYear = new Date().getFullYear();
  const booksThisYear = isOwn
    ? Object.entries(finishedDates || {}).filter(([, d]) => new Date(d).getFullYear() === thisYear).length
    : null;

  const pickFromTBR = () => {
    const tbr = (activeShelves["Want to Read"] || []);
    if (!tbr.length) { alert("TBR shelf is empty!"); return; }
    const book = BOOKS_DB.find(b => b.id === tbr[Math.floor(Math.random() * tbr.length)]);
    setTbrPick(book || null);
  };

  const startEdit = () => { setTempWarnings([...prefExWarnings]); setTempTropes([...prefExTropes]); setTempTags([...prefExTags]); setEditingPrefs(true); };
  const saveEdit = () => { saveExclusionPrefs(tempWarnings, tempTropes, tempTags); setEditingPrefs(false); };

  const hiddenFromFriends = ["Recommended"];
  const customShelves = Object.keys(activeShelves).filter(k =>
    !PROFILE_SHELVES.map(s => s.key).includes(k) && !hiddenFromFriends.includes(k)
  );

  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",backdropFilter:"blur(8px)",zIndex:2500,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",overflowY:"auto" }}>
      <div onClick={e => e.stopPropagation()} style={{ background:"linear-gradient(160deg,#2B1E2F 0%,#1a1220 100%)",borderRadius:"20px",maxWidth:"620px",width:"100%",maxHeight:"90vh",overflowY:"auto",border:"1px solid rgba(194,122,58,0.25)",boxShadow:"0 24px 80px rgba(0,0,0,0.7)" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,rgba(74,44,35,0.55),rgba(43,30,47,0.55))",padding:"26px 28px 20px",borderBottom:"1px solid rgba(194,122,58,0.15)",position:"relative" }}>
          <button onClick={onClose} style={{ position:"absolute",top:"14px",right:"16px",background:"none",border:"none",color:"rgba(232,220,203,0.6)",fontSize:"20px",cursor:"pointer" }}>✕</button>
          <div style={{ display:"flex",alignItems:"center",gap:"16px" }}>
            <div style={{ width:"54px",height:"54px",borderRadius:"50%",background:`linear-gradient(135deg,#C27A3A,#A86830)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px",flexShrink:0,boxShadow:"0 4px 14px rgba(194,122,58,0.3)" }}>📖</div>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif",color:"#E8DCCB",fontSize:"20px",fontWeight:700 }}>
                {profileUser?.username ? `@${profileUser.username}` : profileUser?.display_name || "Reader"}
              </div>
              {isOwn && booksThisYear !== null && (
                <div style={{ marginTop:"5px",display:"flex",alignItems:"center",gap:"8px" }}>
                  <span style={{ fontSize:"22px",fontWeight:800,color:"#C27A3A",fontFamily:"'Playfair Display',serif" }}>{booksThisYear}</span>
                  <span style={{ color:"rgba(232,220,203,0.55)",fontSize:"12px" }}>books read in {thisYear}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding:"60px 20px",textAlign:"center",color:"rgba(232,220,203,0.4)",fontSize:"14px" }}>Loading profile...</div>
        ) : (
          <div style={{ padding:"24px 28px" }}>

            {/* Shelves & Collections */}
            <div style={{ marginBottom:"24px" }}>
              <div style={{ fontSize:"11px",fontWeight:700,color:"#C27A3A",letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"12px" }}>Shelves & Collections</div>
              <div style={{ display:"flex",flexDirection:"column",gap:"7px" }}>
                {PROFILE_SHELVES.map(({ key, emoji, color }) => {
                  const ids = activeShelves[key] || [];
                  const count = ids.length;
                  const preview = ids.slice(0, 3).map(id => BOOKS_DB.find(b => b.id === id)).filter(Boolean);
                  return (
                    <div key={key} style={{ padding:"10px 14px",background:"rgba(232,220,203,0.03)",borderRadius:"10px",border:`1px solid ${count ? "rgba(194,122,58,0.1)" : "rgba(232,220,203,0.05)"}` }}>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                        <span style={{ fontSize:"13px",color,fontWeight:600 }}>{emoji} {key}</span>
                        <span style={{ fontSize:"12px",color:"rgba(232,220,203,0.45)",fontWeight:600 }}>
                          {key === "Desert Island 5" ? `${count}/5${count >= 5 ? " 🌴" : ""}` : count}
                        </span>
                      </div>
                      {preview.length > 0 && (
                        <div style={{ marginTop:"5px",fontSize:"11px",color:"rgba(232,220,203,0.38)",lineHeight:1.4 }}>
                          {preview.map(b => b.title).join(" · ")}{count > 3 ? ` +${count - 3} more` : ""}
                        </div>
                      )}
                      {key === "Want to Read" && isOwn && (
                        <button onClick={pickFromTBR} style={{ marginTop:"8px",padding:"5px 12px",background:"rgba(194,122,58,0.12)",border:"1px solid rgba(194,122,58,0.35)",borderRadius:"6px",color:"#C27A3A",fontSize:"11px",fontWeight:700,cursor:"pointer" }}>
                          🎲 TBR Jar — Pick One for Me!
                        </button>
                      )}
                    </div>
                  );
                })}
                {customShelves.map(key => (
                  <div key={key} style={{ padding:"10px 14px",background:"rgba(232,220,203,0.03)",borderRadius:"10px",border:"1px solid rgba(232,220,203,0.05)" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                      <span style={{ fontSize:"13px",color:"#E8DCCB",fontWeight:600 }}>📂 {key}</span>
                      <span style={{ fontSize:"12px",color:"rgba(232,220,203,0.45)",fontWeight:600 }}>{(activeShelves[key] || []).length}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TBR Jar Pick Result */}
            {tbrPick && (
              <div style={{ marginBottom:"22px",padding:"14px 16px",background:"rgba(194,122,58,0.07)",border:"1px solid rgba(194,122,58,0.3)",borderRadius:"12px" }}>
                <div style={{ fontSize:"10px",fontWeight:700,color:"#C27A3A",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"8px" }}>🎲 The Jar Picked...</div>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:"12px",flexWrap:"wrap" }}>
                  <div>
                    <div style={{ color:"#E8DCCB",fontSize:"15px",fontWeight:700 }}>{tbrPick.title}</div>
                    <div style={{ color:"rgba(232,220,203,0.55)",fontSize:"12px",marginTop:"2px" }}>by {tbrPick.author}</div>
                  </div>
                  <div style={{ display:"flex",gap:"7px",flexShrink:0 }}>
                    <button onClick={() => { onBookClick(tbrPick); onClose(); }} style={{ padding:"6px 13px",background:"rgba(53,96,90,0.25)",border:"1px solid #35605A",borderRadius:"6px",color:"#35605A",fontSize:"11px",fontWeight:700,cursor:"pointer" }}>View</button>
                    <button onClick={pickFromTBR} style={{ padding:"6px 13px",background:"rgba(194,122,58,0.15)",border:"1px solid rgba(194,122,58,0.4)",borderRadius:"6px",color:"#C27A3A",fontSize:"11px",fontWeight:700,cursor:"pointer" }}>Repick 🎲</button>
                  </div>
                </div>
              </div>
            )}

            {/* Default Exclusions — own profile only */}
            {isOwn && (<>
              <div style={{ marginBottom: editingPrefs ? "14px" : "24px" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px" }}>
                <div>
                  <div style={{ fontSize:"11px",fontWeight:700,color:"#8B3A3A",letterSpacing:"1.2px",textTransform:"uppercase" }}>My Default Exclusions</div>
                  <div style={{ fontSize:"11px",color:"rgba(232,220,203,0.38)",marginTop:"3px" }}>Content you always filter out</div>
                </div>
                {!editingPrefs && (
                  <button onClick={startEdit} style={{ fontSize:"11px",color:"#35605A",background:"none",border:"none",cursor:"pointer",fontWeight:600,flexShrink:0 }}>Edit ✏️</button>
                )}
              </div>
              {editingPrefs ? (
                <div style={{ display:"flex",flexDirection:"column",gap:"10px" }}>
                  <MultiSelect label="Warnings" options={ALL_WARNINGS} selected={tempWarnings} onChange={setTempWarnings} placeholder="Warnings to always exclude..." />
                  <MultiSelect label="Tropes" options={ALL_TROPES} selected={tempTropes} onChange={setTempTropes} placeholder="Tropes to always exclude..." />
                  <MultiSelect label="Tags" options={ALL_TAGS} selected={tempTags} onChange={setTempTags} placeholder="Tags to always exclude..." />
                </div>
              ) : hasAnyExclusions ? (
                <div style={{ display:"flex",flexDirection:"column",gap:"8px" }}>
                  {prefExWarnings.length > 0 && (
                    <div>
                      <div style={{ fontSize:"10px",fontWeight:700,color:"rgba(139,58,58,0.8)",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"5px" }}>Warnings</div>
                      <div style={{ display:"flex",flexWrap:"wrap",gap:"5px" }}>{prefExWarnings.map(w => <Badge key={w} text={w} color="#C27A3A" border="1px solid rgba(139,58,58,0.4)" />)}</div>
                    </div>
                  )}
                  {prefExTropes.length > 0 && (
                    <div>
                      <div style={{ fontSize:"10px",fontWeight:700,color:"rgba(139,58,58,0.8)",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"5px" }}>Tropes</div>
                      <div style={{ display:"flex",flexWrap:"wrap",gap:"5px" }}>{prefExTropes.map(t => <Badge key={t} text={t} color="#C27A3A" border="1px solid rgba(139,58,58,0.4)" />)}</div>
                    </div>
                  )}
                  {prefExTags.length > 0 && (
                    <div>
                      <div style={{ fontSize:"10px",fontWeight:700,color:"rgba(139,58,58,0.8)",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"5px" }}>Tags</div>
                      <div style={{ display:"flex",flexWrap:"wrap",gap:"5px" }}>{prefExTags.map(t => <Badge key={t} text={t} color="#C27A3A" border="1px solid rgba(139,58,58,0.4)" />)}</div>
                    </div>
                  )}
                </div>
              ) : (
                <span style={{ color:"rgba(232,220,203,0.28)",fontSize:"12px",fontStyle:"italic" }}>
                  Tap Edit to set content you always filter out
                </span>
              )}
            </div>

            {/* Edit Save/Cancel */}
            {editingPrefs && (
              <div style={{ display:"flex",gap:"8px",marginBottom:"24px" }}>
                <button onClick={saveEdit} style={{ padding:"9px 22px",background:"linear-gradient(135deg,#C27A3A,#A86830)",border:"none",borderRadius:"8px",color:"#fff",fontSize:"12px",fontWeight:700,cursor:"pointer" }}>Save</button>
                <button onClick={() => setEditingPrefs(false)} style={{ padding:"9px 18px",background:"rgba(232,220,203,0.05)",border:"1px solid rgba(232,220,203,0.15)",borderRadius:"8px",color:"#E8DCCB",fontSize:"12px",fontWeight:600,cursor:"pointer" }}>Cancel</button>
              </div>
            )}
            </>)}

            {/* Coming Soon */}
            <div style={{ padding:"16px 18px",background:"rgba(53,96,90,0.06)",borderRadius:"14px",border:"1px solid rgba(53,96,90,0.14)" }}>
              <div style={{ fontSize:"11px",fontWeight:700,color:"#35605A",letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"12px" }}>🚀 Coming Soon to Profiles</div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px" }}>
                {PROFILE_COMING_SOON.map(({ emoji, label }) => (
                  <div key={label} style={{ display:"flex",alignItems:"center",gap:"7px",padding:"6px 9px",background:"rgba(232,220,203,0.02)",borderRadius:"7px" }}>
                    <span style={{ fontSize:"13px" }}>{emoji}</span>
                    <span style={{ fontSize:"11px",color:"rgba(232,220,203,0.38)" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Filters Sidebar Content ───
const FiltersContent = ({
  isMobile = false, setShowMobileFilters, clearAllFilters, trackFilter,
  includeWarnings, setIncludeWarnings, includeTropes, setIncludeTropes, includeTags, setIncludeTags,
  excludeWarnings, setExcludeWarnings, excludeTropes, setExcludeTropes, excludeTags, setExcludeTags,
  selectedGenres, setSelectedGenres, contentRatings, setContentRatings,
  sortBy, setSortBy, seriesStatus, setSeriesStatus,
  minPages, setMinPages, maxPages, setMaxPages,
  minWords, setMinWords, maxWords, setMaxWords, language, setLanguage,
}) => (
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
const BookDetailModal = ({ book, onClose, getBookShelf, requireAuth, showShelfPicker, setShowShelfPicker, shelves, addToShelf, isAuthenticated, friends, showRecPanel, setShowRecPanel, user, recommendBook, getBookRecs }) => {
  const [recNote, setRecNote] = useState("");
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
            <div style={{ marginTop: "12px", position: "relative", display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button onClick={() => { if (requireAuth("Save books to your personal shelves! Create a free account to start organizing your reading list.")) setShowShelfPicker(showShelfPicker === book.id ? null : book.id); }} style={{ padding: "8px 16px", background: shelf ? C.teal : "rgba(53,96,90,0.2)", border: `1px solid ${C.teal}`, borderRadius: "6px", color: shelf ? "#fff" : C.teal, fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                {shelf ? `📚 ${shelf}` : "＋ Add to Shelf"}
              </button>
              {isAuthenticated && friends.length > 0 && (
                <button onClick={() => setShowRecPanel(showRecPanel ? false : book.id)} style={{ padding: "8px 16px", background: "rgba(53,96,90,0.15)", border: `1px solid ${C.teal}`, borderRadius: "6px", color: C.teal, fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                  📤 Recommend
                </button>
              )}
              {book.isbn && (
                <>
                  <a href={`https://bookshop.org/a/123043/${book.isbn}`} target="_blank" rel="noreferrer" onClick={() => trackEvent("affiliate_click", { store: "bookshop", bookId: book.id, title: book.title })} style={{ padding: "8px 16px", background: "rgba(194,122,58,0.15)", border: `1px solid ${C.copper}`, borderRadius: "6px", color: C.copper, fontSize: "12px", fontWeight: 600, textDecoration: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    🛒 Bookshop.org
                  </a>
                  <a href={`https://www.amazon.com/s?k=${book.isbn}&tag=readersreal0e-20`} target="_blank" rel="noreferrer" onClick={() => trackEvent("affiliate_click", { store: "amazon", bookId: book.id, title: book.title })} style={{ padding: "8px 16px", background: "rgba(194,122,58,0.15)", border: `1px solid ${C.copper}`, borderRadius: "6px", color: C.copper, fontSize: "12px", fontWeight: 600, textDecoration: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
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
                  <textarea
                    placeholder="Add a note (optional)..."
                    value={recNote}
                    onChange={e => setRecNote(e.target.value)}
                    rows={3}
                    style={{ width: "100%", padding: "8px 10px", background: "rgba(43,30,47,0.6)", border: "1px solid rgba(53,96,90,0.3)", borderRadius: "6px", color: C.cream, fontSize: "12px", marginBottom: "8px", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
                  />
                  {friends.map(f => {
                    const friend = f.requester_id === user.id ? f.addressee : f.requester;
                    return (
                      <div key={f.id} onClick={() => { recommendBook(book.id, friend.id, recNote); setShowRecPanel(false); }} style={{ padding: "8px 10px", cursor: "pointer", fontSize: "12px", color: C.cream, borderRadius: "6px", marginBottom: "2px" }} onMouseOver={e=>e.target.style.background="rgba(53,96,90,0.2)"} onMouseOut={e=>e.target.style.background="transparent"}>
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

  const PROTECTED_SHELVES = ["Currently Reading", "Finished", "Recommended", "Want to Read", "Desert Island 5", "DNF", "Re-read", "Lend & Borrow"];
  const DEFAULT_SHELVES = { "Want to Read":[], "Currently Reading":[], "Finished":[], "Recommended":[], "Desert Island 5":[], "DNF":[], "Re-read":[], "Lend & Borrow":[], "Kid #1 Reading List":[], "Books to Buy My Best Friend":[] };

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
  const [showRecPanel, setShowRecPanel] = useState(false);

  // Account & username
  const [showAccount, setShowAccount] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
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

  // Profile features
  const [finishedDates, setFinishedDates] = useState({});
  // Profile exclusion preferences
  const [prefExWarnings, setPrefExWarnings] = useState([]);
  const [prefExTropes, setPrefExTropes] = useState([]);
  const [prefExTags, setPrefExTags] = useState([]);
  const [showProfile, setShowProfile] = useState(null); // null | "own" | {id, username, display_name}

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

  // Load finished dates from localStorage
  useEffect(() => {
    if (!user) return;
    try {
      const stored = localStorage.getItem(`rr_finished_${user.id}`);
      if (stored) setFinishedDates(JSON.parse(stored));
    } catch {}
  }, [user]);

  // Save finished dates to localStorage
  useEffect(() => {
    if (!user || !Object.keys(finishedDates).length) return;
    localStorage.setItem(`rr_finished_${user.id}`, JSON.stringify(finishedDates));
  }, [finishedDates, user]);

  // Load friends & recommendations + username
  useEffect(() => {
    if (!isAuthenticated) return;
    const loadSocial = async () => {
      // Load username + fav prefs
      const { data: profile } = await supabase.from("profiles").select("username, pref_ex_warnings, pref_ex_tropes, pref_ex_tags").eq("id", user.id).maybeSingle();
      if (profile?.username) { setUsername(profile.username); setUsernameInput(profile.username); }
      const stored = localStorage.getItem(`rr_exclusions_${user.id}`);
      const localPrefs = stored ? (() => { try { return JSON.parse(stored); } catch { return {}; } })() : {};
      if (profile?.pref_ex_warnings) try { setPrefExWarnings(JSON.parse(profile.pref_ex_warnings)); } catch {}
      else if (localPrefs.warnings) setPrefExWarnings(localPrefs.warnings);
      if (profile?.pref_ex_tropes) try { setPrefExTropes(JSON.parse(profile.pref_ex_tropes)); } catch {}
      else if (localPrefs.tropes) setPrefExTropes(localPrefs.tropes);
      if (profile?.pref_ex_tags) try { setPrefExTags(JSON.parse(profile.pref_ex_tags)); } catch {}
      else if (localPrefs.tags) setPrefExTags(localPrefs.tags);
      setProfileLoaded(true);
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
    if (!window.confirm(`Delete "${name}" shelf?`)) return;
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

  const saveExclusionPrefs = async (warnings, tropes, tags) => {
    setPrefExWarnings(warnings);
    setPrefExTropes(tropes);
    setPrefExTags(tags);
    localStorage.setItem(`rr_exclusions_${user?.id}`, JSON.stringify({ warnings, tropes, tags }));
    // Requires pref_ex_warnings, pref_ex_tropes, pref_ex_tags text columns in profiles table
    if (isAuthenticated) {
      try { await supabase.from("profiles").update({ pref_ex_warnings: JSON.stringify(warnings), pref_ex_tropes: JSON.stringify(tropes), pref_ex_tags: JSON.stringify(tags) }).eq("id", user.id); } catch {}
    }
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

  const recommendBook = async (bookId, friendId, note = "") => {
    if (!note && !window.confirm("Send recommendation without a note?")) return;
    await supabase.from("recommendations").insert({ from_user_id: user.id, to_user_id: friendId, book_id: bookId, note });
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

  // Helper to track filter usage — skips if the current user is the owner
  const trackFilter = (filterName, value) => {
    if (user?.email === OWNER_EMAIL) return; // don't track your own usage
    trackGA("filter_used", { filter: filterName, value: String(value) });
  };

  const filterProps = {
    clearAllFilters, trackFilter, setShowMobileFilters,
    includeWarnings, setIncludeWarnings, includeTropes, setIncludeTropes, includeTags, setIncludeTags,
    excludeWarnings, setExcludeWarnings, excludeTropes, setExcludeTropes, excludeTags, setExcludeTags,
    selectedGenres, setSelectedGenres, contentRatings, setContentRatings,
    sortBy, setSortBy, seriesStatus, setSeriesStatus,
    minPages, setMinPages, maxPages, setMaxPages,
    minWords, setMinWords, maxWords, setMaxWords, language, setLanguage,
  };

  const addToShelf = (bookId, shelfName) => {
    if (shelfName === "Desert Island 5") {
      const current = shelves["Desert Island 5"] || [];
      if (current.length >= 5 && !current.includes(bookId)) {
        alert("Your Desert Island 5 is full! Remove a book first to swap it out."); return;
      }
    }
    setShelves(prev => {
      const u = { ...prev };
      Object.keys(u).forEach(k => { u[k] = u[k].filter(id => id !== bookId); });
      u[shelfName] = [...(u[shelfName] || []), bookId];
      return u;
    });
    if (shelfName === "Finished") {
      setFinishedDates(prev => ({ ...prev, [bookId]: new Date().toISOString() }));
    }
    setShowShelfPicker(null);
  };

  const getBookShelf = (bookId) => {
    for (const [name, ids] of Object.entries(shelves)) { if (ids.includes(bookId)) return name; }
    return null;
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

      {/* Username Setup Modal — shown to existing users who never set a username */}
      {isAuthenticated && profileLoaded && !username && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px" }}>
          <div style={{ background:"linear-gradient(160deg,#2B1E2F,#1a1220)",borderRadius:"18px",maxWidth:"420px",width:"100%",padding:"36px 32px",border:"1px solid rgba(194,122,58,0.3)",textAlign:"center" }}>
            <div style={{ fontSize:"40px",marginBottom:"16px" }}>👤</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif",color:"#E8DCCB",fontSize:"22px",fontWeight:700,margin:"0 0 10px" }}>Choose a Username</h2>
            <p style={{ color:"rgba(232,220,203,0.6)",fontSize:"14px",margin:"0 0 24px",lineHeight:1.5 }}>
              Friends will use this to find and connect with you. You can't skip this step.
            </p>
            <input
              type="text"
              placeholder="e.g. bookworm_42"
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              onKeyDown={e => e.key === "Enter" && saveUsername()}
              style={{ width:"100%",padding:"14px 18px",background:"rgba(43,30,47,0.8)",border:"1px solid rgba(194,122,58,0.3)",borderRadius:"10px",color:"#E8DCCB",fontSize:"14px",marginBottom:"10px",boxSizing:"border-box" }}
            />
            {usernameError && <div style={{ color:"#C27A3A",fontSize:"12px",marginBottom:"10px" }}>{usernameError}</div>}
            <div style={{ color:"rgba(232,220,203,0.35)",fontSize:"11px",marginBottom:"20px" }}>
              Lowercase letters, numbers, and underscores only. Min 3 characters.
            </div>
            <button
              onClick={saveUsername}
              style={{ width:"100%",padding:"14px",background:"linear-gradient(135deg,#C27A3A,#A86830)",border:"none",borderRadius:"10px",color:"#fff",fontSize:"15px",fontWeight:700,cursor:"pointer" }}
            >
              Set Username & Continue
            </button>
          </div>
        </div>
      )}

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
                    <button onClick={() => { setShowFriends(false); setShowProfile(friend); }} style={{ padding:"5px 13px",background:"rgba(194,122,58,0.12)",border:"1px solid rgba(194,122,58,0.3)",borderRadius:"6px",color:C.copper,fontSize:"11px",fontWeight:700,cursor:"pointer" }}>View Profile</button>
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

      {selectedBook && <BookDetailModal book={selectedBook} onClose={() => { setSelectedBook(null); setShowShelfPicker(null); }} getBookShelf={getBookShelf} requireAuth={requireAuth} showShelfPicker={showShelfPicker} setShowShelfPicker={setShowShelfPicker} shelves={shelves} addToShelf={addToShelf} isAuthenticated={isAuthenticated} friends={friends} showRecPanel={showRecPanel} setShowRecPanel={setShowRecPanel} user={user} recommendBook={recommendBook} getBookRecs={getBookRecs} />}

      {/* Profile Modal — own or friend */}
      {showProfile && isAuthenticated && (
        <ProfileModal
          isOwn={showProfile === "own"}
          profileUser={showProfile === "own" ? { id: user.id, username } : showProfile}
          ownShelves={shelves}
          finishedDates={finishedDates}
          prefExWarnings={prefExWarnings}
          prefExTropes={prefExTropes}
          prefExTags={prefExTags}
          saveExclusionPrefs={saveExclusionPrefs}
          onClose={() => setShowProfile(null)}
          onBookClick={(book) => { setShowProfile(null); setSelectedBook(book); }}
        />
      )}

      {/* Account Modal */}
      {showAccount && isAuthenticated && (
        <AccountModal
          user={user} username={username} usernameInput={usernameInput} setUsernameInput={setUsernameInput}
          usernameError={usernameError} usernameSaved={usernameSaved} saveUsername={saveUsername}
          showChangePassword={showChangePassword} setShowChangePassword={setShowChangePassword}
          newPassword={newPassword} setNewPassword={setNewPassword} passwordMsg={passwordMsg} changePassword={changePassword}
          shelves={shelves} finishedDates={finishedDates} prefExWarnings={prefExWarnings} prefExTropes={prefExTropes} prefExTags={prefExTags}
          onClose={() => setShowAccount(false)} onOpenProfile={() => { setShowAccount(false); setShowProfile("own"); }}
        />
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
          <FiltersContent isMobile {...filterProps} />
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

      {/* Nightly Campfire Banner */}
      <Link to="/campfire" onClick={e => { if (!requireAuth("Join the Campfire to read alongside others. Create a free account to access this cozy feature!")) e.preventDefault(); }} style={{ display:"block", textAlign:"center", padding:"9px 20px", background:"linear-gradient(90deg, rgba(194,122,58,0.06), rgba(194,122,58,0.13), rgba(194,122,58,0.06))", borderBottom:"1px solid rgba(194,122,58,0.12)", textDecoration:"none", color:C.cream, fontSize:"13px", position:"relative", zIndex:40 }}>
        🔥 <strong style={{ color:C.copper }}>Nightly Campfire</strong> — Read alongside others every night 7 PM – 10 PM EST <span style={{ color:"rgba(232,220,203,0.4)", fontSize:"11px" }}>→ Join</span>
      </Link>

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
            <FiltersContent {...filterProps} />
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
