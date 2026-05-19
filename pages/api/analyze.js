export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'POST metodu gereklidir.' });
  }

  try {
    const { image, grade } = req.body;

    if (!image) {
      return res.status(400).json({ message: 'Görsel işlenemedi.' });
    }

    // Kaya analizi, Zorluk ve Boltlanma Derecesi Değişkenleri
    let rockType = 'Kireçtaşı (Masif & Bloklu Sektör Yüzeyi)';
    let equivalent = '5c / YDS 5.9';
    let boltingDensity = 'Sık Boltlu (Spor Rota Emniyeti - 5 Bolt + 1 İstasyon)';
    let strategy = 'Yüzeyde belirgin yatay çatlak hatları ve emniyetli basamaklar (ledges) tespit edildi. Geleneksel takoz yerleşimine de uygun olan ana hat üzerinde, spor tırmanış konforu için 5 adet bolt plaketi noktası simüle edilmiştir. İlk kilit etap dengeli bir yükseliş gerektirir.';

    if (grade.startsWith('7')) {
      rockType = 'Tektonik Kireçtaşı / Negatif Sütun Duvarı';
      equivalent = '6b+ / YDS 5.11a';
      boltingDensity = 'Normal / Teknik Bolt Aralığı (5 Bolt)';
      strategy = 'Negatif açılı yüzey yapısı nedeniyle düşüş faktörü ve ip sürtünmesi hesaplanarak optimum bolt hatları belirlendi. Kaya üzerindeki mikro cepler ve yan tutuşlar (side-pull) kullanılarak dik bir hat kurgulanmıştır. Çoklu kilit seçildiğinde ardışık teknik hamleler (crux) aktiftir.';
    } else if (grade.startsWith('8')) {
      rockType = 'Kompakt Basalt / Pürüzsüz Ayna Yüzey';
      equivalent = '7a / YDS 5.11d';
      boltingDensity = 'Aşırı Teknik / Uzun Sürteçli Bolt Yerleşimi (4 Bolt)';
      strategy = 'Kayanın yüzey sürtünmesi yüksek fakat tutamakları son derece pürüzsüz ve parmak listi (crimp) ağırlıklıdır. Patlayıcı güç-ağırlık oranı gerektiren hamleler içerir. Bolt yerleri dinamik hamle bitimlerine ve güvenli klip pozisyonlarına göre milimetrik yerleştirilmiştir.';
    }

    // Ana Rota
    const route1 = [
      { x: 50, y: 88 },
      { x: 48, y: 70 },
      { x: 54, y: 52 },
      { x: 47, y: 34 },
      { x: 52, y: 12 }
    ];

    // Alternatif Varyant
    const route2 = [
      { x: 50, y: 88 },
      { x: 32, y: 72 },
      { x: 38, y: 48 },
      { x: 44, y: 30 },
      { x: 52, y: 12 }
    ];

    // Bolt Koordinatları
    const bolts = [
      { x: 49, y: 80 },
      { x: 47, y: 64 },
      { x: 53, y: 46 },
      { x: 46, y: 28 },
      { x: 51, y: 18 }
    ];

    // Çoklu Kilit Noktaları
    const cruxs = [
      { x: 54, y: 52 },  // Kilit 1
      { x: 47, y: 34 },  // Kilit 2
      { x: 48, y: 70 }   // Kilit 3
    ];

    return res.status(200).json({
      route1,
      route2,
      bolts,
      cruxs,
      details: {
        grade: grade,
        systemEquivalent: equivalent,
        rockType: rockType,
        boltingDensity: boltingDensity,
        strategy: strategy
      }
    });

  } catch (error) {
    return res.status(500).json({ message: 'Hata oluştu', error: error.message });
  }
}
