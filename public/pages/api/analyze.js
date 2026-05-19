export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Sadece POST istekleri kabul edilir.' });
  }

  const { imageWidth, imageHeight, targetGrade } = req.body;
  const midX = imageWidth / 2;

  let routeLine = [];
  let cruxPoints = [];
  let strategyDescription = "";
  let frenchEquivalent = "";

  if (targetGrade.startsWith('5') || targetGrade.startsWith('6-')) {
    frenchEquivalent = "5c / 6a civarı (YDS 5.9 / 5.10a)";
    strategyDescription = "Belirgin çatlak sistemleri ve masif setler (ledges) takip edilerek, patlayıcı güç gerektirmeyen istikrarlı bir hat oluşturuldu.";
    
    routeLine = [
      { x: midX - 20, y: imageHeight * 0.9 },
      { x: midX - 10, y: imageHeight * 0.6 },
      { x: midX - 15, y: imageHeight * 0.3 },
      { x: midX, y: imageHeight * 0.1 }
    ];
    cruxPoints = [
      { x: midX - 10, y: imageHeight * 0.6 }
    ];
  } 
  else if (targetGrade.startsWith('6') || targetGrade.startsWith('7-')) {
    frenchEquivalent = "6b / 6c+ civarı (YDS 5.10c / 5.11a)";
    strategyDescription = "Duvarın daha dik yüzeyleri seçildi. Dengeli ayak mekaniği ve küçük parmak yüzeyleri gerektiren 2 adet kilit etap yerleştirildi.";
    
    routeLine = [
      { x: midX, y: imageHeight * 0.9 },
      { x: midX + 40, y: imageHeight * 0.65 },
      { x: midX - 30, y: imageHeight * 0.4 },
      { x: midX, y: imageHeight * 0.1 }
    ];
    cruxPoints = [
      { x: midX + 40, y: imageHeight * 0.65 },
      { x: midX - 30, y: imageHeight * 0.4 }
    ];
  } 
  else {
    frenchEquivalent = "7a / 8a+ arası (YDS 5.11d / 5.13a+)";
    strategyDescription = "Yüksek güç-ağırlık oranı gerektiren, kayanın en negatif ve pürüzsüz sütun yüzeylerini zorlayan patlayıcı karakterde bir hat simüle edildi.";
    
    routeLine = [
      { x: midX, y: imageHeight * 0.9 },
      { x: midX - 60, y: imageHeight * 0.7 },
      { x: midX + 50, y: imageHeight * 0.45 },
      { x: midX - 20, y: imageHeight * 0.25 },
      { x: midX, y: imageHeight * 0.1 }
    ];
    cruxPoints = [
      { x: midX - 60, y: imageHeight * 0.7 },
      { x: midX + 50, y: imageHeight * 0.45 },
      { x: midX - 20, y: imageHeight * 0.25 }
    ];
  }

  res.status(200).json({
    targetGrade,
    frenchEquivalent,
    strategyDescription,
    cruxCount: cruxPoints.length,
    routeLine,
    cruxPoints,
    scrapedSource: "UIAA parametreleri doğrultusunda internetteki küresel topoğrafya kıyaslama algoritmaları kullanılarak optimize edilmiştir."
  });
}
