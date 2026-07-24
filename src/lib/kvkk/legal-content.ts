import { KVKK_VERSION } from "./constants";

export interface LegalSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDocument {
  subtitle: string;
  meta: { label: string; value: string }[];
  sections: LegalSection[];
  footer?: string;
}

export interface CancelPolicy {
  free_cancel_hours: number;
  late_cancel_penalty_minutes: number;
}

const DEFAULT_CANCEL_POLICY: CancelPolicy = {
  free_cancel_hours: 6,
  late_cancel_penalty_minutes: 30,
};

export const AYDINLATMA_DOCUMENT: LegalDocument = {
  subtitle: `KVKK Aydınlatma Metni (${KVKK_VERSION})`,
  meta: [
    { label: "Veri Sorumlusu", value: "JFS Method Hareket Danışmanlığı" },
    { label: "İletişim", value: "kvkk@jfsmethod.com" },
  ],
  sections: [
    {
      title: "1. İşlenen Kişisel Veriler",
      paragraphs: [
        "Kimlik bilgileri (ad, soyad), iletişim bilgileri (e-posta, telefon), sağlık verileri (boy, kilo, tedavi notları, randevu bilgileri) ve işlem güvenliği verileri (IP adresi, log kayıtları) işlenmektedir.",
      ],
    },
    {
      title: "2. İşleme Amaçları",
      bullets: [
        "Fizyoterapi hizmetlerinin sunulması ve randevu yönetimi",
        "Kişiselleştirilmiş dijital sağlık takibi",
        "Yasal yükümlülüklerin yerine getirilmesi",
        "Bilgi güvenliği süreçlerinin yürütülmesi",
      ],
    },
    {
      title: "3. Hukuki Sebepler",
      paragraphs: [
        "KVKK m.5/2 (c) sözleşmenin kurulması/ifası, m.5/2 (ç) hukuki yükümlülük, m.5/2 (f) meşru menfaat ve sağlık verileri için m.6 açık rızanız.",
      ],
    },
    {
      title: "4. Aktarım",
      paragraphs: [
        "Verileriniz yalnızca yasal zorunluluk halinde yetkili kamu kurumlarıyla ve hizmet aldığımız güvenli altyapı sağlayıcılarıyla paylaşılabilir.",
      ],
    },
    {
      title: "5. Haklarınız",
      paragraphs: [
        "KVKK m.11 kapsamında; erişim, düzeltme, silme, işlemeyi kısıtlama, itiraz ve veri taşınabilirliği haklarına sahipsiniz.",
        "Başvuru: kvkk@jfsmethod.com",
      ],
    },
  ],
};

export const ACIK_RIZA_DOCUMENT: LegalDocument = {
  subtitle: `Özel Nitelikli Sağlık Verileri Açık Rıza Metni (${KVKK_VERSION})`,
  meta: [
    { label: "Yasal Dayanak", value: "6698 sayılı KVKK m.6" },
    { label: "İletişim", value: "kvkk@jfsmethod.com" },
  ],
  sections: [
    {
      title: "Kapsam",
      paragraphs: [
        "Özel nitelikli kişisel veri niteliğindeki sağlık verileriniz (boy, kilo, kilo geçmişi, fizyoterapi notları, randevu ve tedavi bilgileri) JFS Method platformunda aşağıdaki amaçlarla işlenecektir:",
      ],
      bullets: [
        "Kişiselleştirilmiş dijital sağlık ikizi oluşturulması",
        "Fizyoterapi tedavi sürecinizin takibi",
        "Uzman fizyoterapist ile randevu ve iletişim süreçlerinin yürütülmesi",
      ],
    },
    {
      title: "Açık Rıza Beyanı",
      paragraphs: [
        "Yukarıda belirtilen sağlık verilerinizin işlenmesine, yurt içinde güvenli sunucularda saklanmasına ve hizmetin gerektirdiği ölçüde yetkili sağlık personeliyle paylaşılmasına özgür iradenizle açık rıza veriyorsunuz.",
      ],
    },
    {
      title: "Rızanın Geri Çekilmesi",
      paragraphs: [
        "Bu rızayı dilediğiniz zaman kvkk@jfsmethod.com adresine başvurarak geri çekebilirsiniz. Rızanın geri çekilmesi, geri çekme öncesi işleme faaliyetlerinin hukuka uygunluğunu etkilemez.",
      ],
    },
  ],
};

export function buildRandevuSozlesmesi(policy: CancelPolicy = DEFAULT_CANCEL_POLICY): LegalDocument {
  const freeCancelLabel =
    policy.free_cancel_hours < 24
      ? `${policy.free_cancel_hours} saat`
      : `${Math.round(policy.free_cancel_hours / 24)} gün`;

  const penaltyLabel =
    policy.late_cancel_penalty_minutes >= 60
      ? `${Math.round(policy.late_cancel_penalty_minutes / 60)} saat`
      : `${policy.late_cancel_penalty_minutes} dakika`;

  return {
    subtitle: `Randevu & İptal Politikası (${KVKK_VERSION})`,
    meta: [
      { label: "Klinik", value: "JFS Method Hareket Danışmanlığı" },
      { label: "İletişim", value: "info@jfsmethod.com" },
    ],
    sections: [
      {
        title: "1. Randevu Oluşturma",
        paragraphs: [
          "Randevular yalnızca aktif seans paketi olan öğrenciler tarafından sistem üzerinden alınabilir. Paket bitiminde yeni bir paket satın alınması gerekmektedir.",
        ],
      },
      {
        title: "2. İptal Politikası",
        paragraphs: [
          `Randevunuzu randevu saatinden en az ${freeCancelLabel} önce iptal ederseniz seans hakkınız iade edilir ve herhangi bir ceza uygulanmaz.`,
          `Randevu saatine ${penaltyLabel} veya daha az kaldığında yapılan iptallerde 1 seans hakkı düşülür. Bu durum, erken iptal ile açılan slotun başka öğrenciye tahsis edilememesinden kaynaklanmaktadır.`,
        ],
      },
      {
        title: "3. Devamsızlık",
        paragraphs: [
          "Randevunuza gelmediyseniz ve önceden iptal etmediyseniz, seansınız \"gelmedi\" olarak işaretlenir ve 1 seans hakkı düşülür.",
          "Devamsızlık geçmişinizi «Hesabım → Paketlerim» bölümünden takip edebilirsiniz.",
        ],
      },
      {
        title: "4. Erteleme",
        paragraphs: [
          "Randevunuzu iptal etmek yerine erteleyebilirsiniz. Erteleme, aynı iptal süresi kurallarına tabidir.",
        ],
      },
      {
        title: "5. Klinik Tarafından İptal",
        paragraphs: [
          "Klinik tarafından gerçekleştirilen iptal veya gün iptali durumunda seans hakkınız iade edilir ve size bildirim gönderilir.",
        ],
      },
    ],
    footer: `Bu politika yürürlükteki klinik ayarlarına göre otomatik oluşturulmuştur. Geçerli sürüm: ${KVKK_VERSION}`,
  };
}
