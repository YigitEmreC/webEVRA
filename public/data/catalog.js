// ─────────────────────────────────────────────────────────────────────────────
//  PRODUCTS AND PACKAGES
//  Everything below is EXAMPLE data. Replace it with your own range and prices.
//
//  This one file feeds the Products page, the Packages page, the cart AND the
//  checkout on the server, so prices only ever need changing here.
//
//  Rules:
//  • Every `id` must be unique, lowercase, without spaces (use - instead).
//    Don't change the id of something customers may already have in their cart.
//  • `price` is in euros including VAT, with a dot for cents: 24.95
//  • `image` is optional. Put the photo in public/assets/img/products/ and
//    write its path, e.g. "/assets/img/products/smart-plug.jpg".
//    Leave it "" to show a neutral placeholder.
// ─────────────────────────────────────────────────────────────────────────────

export const products = [
  {
    id: "hub",
    name: "Smart home hub",
    category: "Hubs & controllers",
    price: 179.0,
    description: "The heart of the system. Runs every automation locally in your home, also without internet.",
    features: ["Local control", "iOS & Android app", "Automatic backups"],
    image: "",
  },
  {
    id: "zigbee-stick",
    name: "Zigbee & Thread USB stick",
    category: "Hubs & controllers",
    price: 29.95,
    description: "Lets the hub talk to wireless sensors and switches throughout the house.",
    features: ["Zigbee 3.0", "Thread ready"],
    image: "",
  },
  {
    id: "wall-panel",
    name: "Wall control panel",
    category: "Hubs & controllers",
    price: 199.0,
    description: "A touch screen on the wall to control lights, heating and scenes without picking up your phone.",
    features: ["Touch screen", "Fits a standard wall box"],
    image: "",
  },
  {
    id: "ir-controller",
    name: "Infrared controller",
    category: "Hubs & controllers",
    price: 39.95,
    description: "Controls devices that come with an IR remote, such as TVs, heaters and air conditioners, from the app.",
    features: ["Learns your remotes", "Works with schedules"],
    image: "",
  },
  {
    id: "smart-plug",
    name: "Smart plug with energy meter",
    category: "Plugs & switches",
    price: 19.95,
    description: "Switch any device on a schedule and see exactly how much energy it uses.",
    features: ["Energy monitoring", "Schedules & timers"],
    image: "",
  },
  {
    id: "colour-bulb",
    name: "Smart colour bulb (E27)",
    category: "Lighting",
    price: 24.95,
    description: "Dimmable bulb in any colour or warm-to-cool white. Fits a standard E27 fitting.",
    features: ["Full colour", "Dimmable"],
    image: "",
  },
  {
    id: "light-strip",
    name: "Smart LED strip (5 m)",
    category: "Lighting",
    price: 59.95,
    description: "Flexible colour LED strip for cabinets, TV walls and stairs.",
    features: ["Colour zones", "Cut to length"],
    image: "",
  },
  {
    id: "door-sensor",
    name: "Door & window sensor",
    category: "Sensors",
    price: 19.95,
    description: "Know when a door or window opens, and use it to switch lights or send an alert.",
    features: ["Battery powered", "Zigbee"],
    image: "",
  },
  {
    id: "motion-sensor",
    name: "Motion sensor",
    category: "Sensors",
    price: 24.95,
    description: "Turns the lights on when you walk in and off when the room is empty.",
    features: ["Battery powered", "Zigbee"],
    image: "",
  },
  {
    id: "climate-sensor",
    name: "Temperature & humidity sensor",
    category: "Sensors",
    price: 17.95,
    description: "Small display with room temperature and humidity, logged in the app.",
    features: ["LCD display", "Battery powered"],
    image: "",
  },
  {
    id: "radiator-valve",
    name: "Smart radiator valve",
    category: "Climate",
    price: 54.95,
    description: "Heats each room only when needed, on a schedule or when someone is home.",
    features: ["Per-room schedules", "Open-window detection"],
    image: "",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  PACKAGES
//  • `items` lists product ids from above with how many are included.
//  • `price` is what the customer pays for the whole package (it may include
//    installation). If it's lower than the products bought separately, the
//    card shows "Worth € … separately" automatically.
//  • `featured: true` also shows the package on the home page.
//  • `badge` is an optional label such as "Most popular". Leave "" for none.
// ─────────────────────────────────────────────────────────────────────────────

export const packages = [
  {
    id: "starter",
    name: "Starter",
    context: "For apartments and first-time smart homes",
    price: 399,
    featured: true,
    badge: "",
    description: "[Describe who this package is for and what it does for them.]",
    items: [
      { id: "hub", qty: 1 },
      { id: "zigbee-stick", qty: 1 },
      { id: "smart-plug", qty: 2 },
      { id: "colour-bulb", qty: 2 },
      { id: "motion-sensor", qty: 1 },
      { id: "door-sensor", qty: 1 },
    ],
    highlights: ["Installation and set-up included", "[Extra, e.g. 1 year of remote support]"],
  },
  {
    id: "comfort",
    name: "Comfort",
    context: "For family homes that want comfort and lower energy bills",
    price: 1149,
    featured: true,
    badge: "Most popular",
    description: "[Describe who this package is for and what it does for them.]",
    items: [
      { id: "hub", qty: 1 },
      { id: "zigbee-stick", qty: 1 },
      { id: "wall-panel", qty: 1 },
      { id: "smart-plug", qty: 4 },
      { id: "colour-bulb", qty: 4 },
      { id: "light-strip", qty: 1 },
      { id: "motion-sensor", qty: 2 },
      { id: "door-sensor", qty: 2 },
      { id: "climate-sensor", qty: 2 },
      { id: "radiator-valve", qty: 3 },
    ],
    highlights: ["Installation and set-up included", "Heating schedules set up per room", "[Extra, e.g. 2 years of remote support]"],
  },
  {
    id: "care",
    name: "Care & safety",
    context: "For older relatives who want to keep living independently",
    price: 699,
    featured: true,
    badge: "",
    description: "[Describe who this package is for and what it does for them.]",
    items: [
      { id: "hub", qty: 1 },
      { id: "zigbee-stick", qty: 1 },
      { id: "wall-panel", qty: 1 },
      { id: "motion-sensor", qty: 3 },
      { id: "door-sensor", qty: 2 },
      { id: "smart-plug", qty: 2 },
    ],
    highlights: ["Installation and set-up included", "[Extra, e.g. alerts to family members]"],
  },
];
