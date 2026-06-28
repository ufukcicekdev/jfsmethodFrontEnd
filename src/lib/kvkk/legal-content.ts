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
