console.log("LIST FILE EXECUTED FROM:", __filename);

export default async function handler(req, res) {
  res.status(200).json({ message: "list.js is alive" });
}
