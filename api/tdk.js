export default async function handler(req, res) {
  const { ara } = req.query;

  if (!ara) {
    return res.status(400).json({ error: 'Kelime eksik' });
  }

  try {
    const response = await fetch(
      `https://sozluk.gov.tr/gts?ara=${encodeURIComponent(ara)}`
    );
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'TDK bağlantı hatası' });
  }
}
