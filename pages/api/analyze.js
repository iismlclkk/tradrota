// Büyük boyutlu resim verilerinin sunucuya hatasız iletilmesi için limit artırımı
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Sadece POST istekleri kabul edilir.' });
  }

  try {
    const { image, grade } = req.body;

    if (!image) {
      return res.status(400).json({ message: 'Görsel verisi bulunamadı.' });
    }

    // Seçilen UIAA zorluk derecesine göre dinamik tırmanış raporu simülasyonu
    let equivalent = '5c / 5.9';
    let strategy = 'Belirgin çatlak sistemleri ve masif setler (ledges) takip edilerek, patlayıcı güç gerektirmeyen istikrarlı bir hat oluşturuldu.';

    if (grade.startsWith('7')) {
      equivalent = '6b+ / 5.11a';
      strategy = 'Negatif açılı yüzeydeki mikro basamaklar ve sığ cepler (pockets) birleştirildi. Teknik ayak hassasiyeti gerektiren hamle dizisi kurgulandı.';
    } else if (grade.startsWith('8')) {
      equivalent = '7a / 5.11d';
      strategy = 'Dinamik kilit hamlesi (dyno) içeren, aşırı küçük parmak listleri (crimps) ve yan tutuşlar (side-pull) üzerine kurulu atletik hat simüle edildi.';
    }

    // Örnek Rota Koordinatları (Yapay Zeka Çizgisi)
    const coordinates = [
      { x: 50, y: 80 },
      { x: 48, y: 65 },
      { x: 52, y: 48 },
      { x: 49, y: 32 },
      { x: 51, y: 15 }
    ];

    // Rota üzerindeki zorluk (Crux) noktası koordinatı
    const crux = { x: 52, y: 48 };

    return res.status(200).json({
      coordinates,
      crux,
      details: {
        grade: grade,
        systemEquivalent: equivalent,
        strategy: strategy
      }
    });

  } catch (error) {
    return res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
}
