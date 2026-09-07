const STORAGE_KEY = "winkgames:hanh-trinh-bo-lac:language";
const SUPPORTED_LANGUAGES = Object.freeze(["en", "vi"]);

const messages = {
  en: {
    "game.title": "PEANUT\nADVENTURE",
    "game.documentTitle": "Peanut Adventure - Swipe RPG",
    "loading.progress": "LOADING {progress}%",
    "menu.play": "PLAY NOW",
    "menu.member": "Member",
    "menu.guest": "Guest",
    "menu.instructions": "HOW TO PLAY",
    "menu.leaderboard": "LEADERBOARD",
    "menu.settings": "SETTINGS",

    "hud.floor": "FLOOR {floor}",
    "hud.power": "POWER: {power}",
    "hud.rollback": "UNDO ({count})",
    "hud.rollbackFree": "UNDO ({count} Free)",
    "hud.rollbackAd": "UNDO (Ad)",
    "hud.rollbackEmpty": "UNDO (0)",
    "hud.rollbackBlocked": "UNDO",
    "hud.bossFloor": "FLOOR {floor} · BOSS BATTLE!",
    "hud.defeat": "DEFEAT",

    "rollback.title": "UNDO",
    "rollback.busy": "PROCESSING",
    "rollback.loadingAd": "Loading advertisement…",
    "rollback.rewinding": "Rewinding 1 step…",
    "rollback.empty": "No steps to undo",
    "rollback.blocked": "Action temporarily locked",
    "rollback.freeDetail": "Undo 1 step · Free",
    "rollback.adDetail": "Watch Ad · Undo 1 step",
    "rollback.adBadge": "AD",

    "tutorial.title": "HOW TO PLAY",
    "tutorial.rule1": "👆 Swipe on the board or use arrow keys. Move 1 cell per step.",
    "tutorial.rule2": "⚔️ You must be STRONGER than a monster to win and absorb its power. Ties lose.",
    "tutorial.rule3": "🍔 + adds power, × multiplies; ÷ is a division trap, rounded down.",
    "tutorial.rule4": "⚠️ Floors COLLAPSE when you step off. Red cells can kill you; plan ahead.",
    "tutorial.rule5": "👑 Defeat the boss to clear the floor. Boss power stays fixed for the floor.",
    "tutorial.rule6": "↻ 3 undos per match; each rewinds 1 step, including a fatal step. Each floor starts with 10 power.",
    "tutorial.understood": "GOT IT!",

    "settings.title": "SETTINGS",
    "settings.music": "MUSIC",
    "settings.sfx": "SOUND FX",
    "settings.language": "LANGUAGE",
    "settings.version": "Version: 1.0.0",
    "settings.english": "English",
    "settings.vietnamese": "Tiếng Việt",

    "actions.home": "Home",
    "actions.replay": "Replay",
    "actions.continue": "Continue",
    "actions.confirm": "Confirm",
    "actions.cancel": "Cancel",
    "actions.skip": "No, thanks",

    "revive.title": "REVIVE?",
    "revive.prompt": "Watch an ad to retry this floor with 10 power.",
    "revive.retry": "RETRY ↻",
    "revive.undoFree": "Undo · {count} free left",
    "revive.undoAd": "Watch Ad · Undo 1 step",
    "revive.adFailed": "Could not claim undo. You can try again.",

    "gameover.title": "GAME OVER",
    "gameover.newRecord": "NEW RECORD!",
    "gameover.highestFloor": "HIGHEST FLOOR: {floor}",
    "gameover.best": "Best: {floor}",
    "gameover.tryAgain": "Great effort! Give it another shot!",

    "leaderboard.title": "LEADERBOARD",
    "leaderboard.rankHeader": "RANK",
    "leaderboard.playerHeader": "PLAYER",
    "leaderboard.floorHeader": "FLOOR",
    "leaderboard.empty": "No rankings yet.<br/>Play now to claim the top spot! 🏆",
    "leaderboard.defaultMember": "Player",
    "leaderboard.defaultMemberNumber": "Player #{rank}",
    "leaderboard.youGuest": "You (Guest)",
    "leaderboard.accountSignedIn": "Account: {name} (Signed in)",
    "leaderboard.memberSignedIn": "Account: Member (Signed in)",
    "leaderboard.signInToSave": "Sign in to Wink to save your score",
    "leaderboard.offline": "Offline (using device data)",
    "leaderboard.rank": "Rank: #{rank}",
    "leaderboard.noRank": "Rank: —",
    "leaderboard.score": "Floor: {score}",
  },
  vi: {
    "game.title": "HÀNH TRÌNH\nBƠ LẠC",
    "game.documentTitle": "Hành Trình Bơ Lạc - Swipe RPG",
    "loading.progress": "ĐANG TẢI {progress}%",
    "menu.play": "CHƠI NGAY",
    "menu.member": "Thành viên",
    "menu.guest": "Khách",
    "menu.instructions": "HƯỚNG DẪN",
    "menu.leaderboard": "XẾP HẠNG",
    "menu.settings": "CÀI ĐẶT",

    "hud.floor": "TẦNG {floor}",
    "hud.power": "SỨC MẠNH: {power}",
    "hud.rollback": "LÙI LƯỢT ({count})",
    "hud.rollbackFree": "LÙI LƯỢT ({count} Free)",
    "hud.rollbackAd": "LÙI LƯỢT (QC)",
    "hud.rollbackEmpty": "LÙI LƯỢT (0)",
    "hud.rollbackBlocked": "LÙI LƯỢT",
    "hud.bossFloor": "TẦNG {floor} · TRẬN ĐÁNH TRÙM!",
    "hud.defeat": "THẤT BẠI",

    "rollback.title": "HOÀN TÁC",
    "rollback.busy": "ĐANG XỬ LÝ",
    "rollback.loadingAd": "Đang tải quảng cáo…",
    "rollback.rewinding": "Đang lùi 1 bước…",
    "rollback.empty": "Chưa có bước để lùi",
    "rollback.blocked": "Tạm khóa thao tác",
    "rollback.freeDetail": "Lùi 1 bước · Miễn phí",
    "rollback.adDetail": "Xem QC · Lùi 1 bước",
    "rollback.adBadge": "QC",

    "tutorial.title": "HƯỚNG DẪN TÂN THỦ",
    "tutorial.rule1": "👆 Vuốt trên bàn hoặc dùng phím mũi tên. Mỗi lần đi 1 ô.",
    "tutorial.rule2": "⚔️ Phải MẠNH HƠN quái để thắng và cộng sức mạnh của nó. Bằng nhau là thua.",
    "tutorial.rule3": "🍔 + là cộng, × là nhân; ÷ là bẫy chia sức mạnh, làm tròn xuống.",
    "tutorial.rule4": "⚠️ Sàn SẬP khi rời ô. Ô đỏ có thể hạ bạn; hãy tính đường trước khi đi.",
    "tutorial.rule5": "👑 Hạ boss để qua tầng. Sức mạnh boss giữ nguyên trong cả tầng.",
    "tutorial.rule6": "↻ 3 lượt hoàn tác mỗi ván; mỗi lần lùi 1 bước, kể cả bước thua. Mỗi tầng bắt đầu với 10 sức mạnh.",
    "tutorial.understood": "ĐÃ HIỂU!",

    "settings.title": "CÀI ĐẶT",
    "settings.music": "ÂM NHẠC",
    "settings.sfx": "HIỆU ỨNG",
    "settings.language": "NGÔN NGỮ",
    "settings.version": "Phiên bản: 1.0.0",
    "settings.english": "English",
    "settings.vietnamese": "Tiếng Việt",

    "actions.home": "Về trang chính",
    "actions.replay": "Chơi lại",
    "actions.continue": "Tiếp tục",
    "actions.confirm": "Đồng ý",
    "actions.cancel": "Hủy",
    "actions.skip": "Không, cảm ơn",

    "revive.title": "TIẾP TỤC?",
    "revive.prompt": "Xem quảng cáo để chơi lại cùng bản đồ, với 10 sức mạnh.",
    "revive.retry": "CHƠI LẠI ↻",
    "revive.undoFree": "Hoàn tác · Còn {count} lượt miễn phí",
    "revive.undoAd": "Xem QC · Hoàn tác 1 bước",
    "revive.adFailed": "Chưa nhận được lượt hoàn tác. Bạn có thể thử lại.",

    "gameover.title": "KẾT THÚC",
    "gameover.newRecord": "KỶ LỤC MỚI!",
    "gameover.highestFloor": "TẦNG CAO NHẤT: {floor}",
    "gameover.best": "Kỷ lục: {floor}",
    "gameover.tryAgain": "Chơi rất tốt! Hãy cố gắng ở lượt sau nhé!",

    "leaderboard.title": "BẢNG XẾP HẠNG",
    "leaderboard.rankHeader": "HẠNG",
    "leaderboard.playerHeader": "NGƯỜI CHƠI",
    "leaderboard.floorHeader": "TẦNG",
    "leaderboard.empty": "Chưa có kỷ lục nào.<br/>Hãy chơi ngay để dẫn đầu bảng vàng! 🏆",
    "leaderboard.defaultMember": "Người chơi",
    "leaderboard.defaultMemberNumber": "Người chơi #{rank}",
    "leaderboard.youGuest": "Bạn (Khách)",
    "leaderboard.accountSignedIn": "Tài khoản: {name} (Đã đăng nhập)",
    "leaderboard.memberSignedIn": "Tài khoản: Thành viên (Đã đăng nhập)",
    "leaderboard.signInToSave": "Đăng nhập Wink để lưu thành tích",
    "leaderboard.offline": "Ngoại tuyến (dữ liệu thiết bị)",
    "leaderboard.rank": "Hạng: #{rank}",
    "leaderboard.noRank": "Hạng: —",
    "leaderboard.score": "Tầng: {score}",
  },
};

function normalizeLanguage(value) {
  if (typeof value !== "string") return null;
  const base = value.trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGUAGES.includes(base) ? base : null;
}

function readStoredLanguage() {
  try {
    return normalizeLanguage(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function readUrlLanguage() {
  try {
    const params = new window.URLSearchParams(window.location.search);
    return normalizeLanguage(
      params.get("locale") || params.get("lang") || params.get("language"),
    );
  } catch {
    return null;
  }
}

function readWinkLanguage(state) {
  return normalizeLanguage(
    state?.locale ||
      state?.language ||
      state?.preferences?.language ||
      state?.preferences?.locale,
  );
}

class I18nManager {
  constructor() {
    this.hasLocalOverride = Boolean(readStoredLanguage());
    this.language =
      readStoredLanguage() ||
      readUrlLanguage() ||
      "en";
    this.listeners = new Set();
    this.applyDocumentLanguage();
  }

  get currentLanguage() {
    return this.language;
  }

  applyDocumentLanguage() {
    if (globalThis.document?.documentElement) {
      document.documentElement.lang = this.language;
      document.title = this.t("game.documentTitle");
    }
  }

  setLanguage(language, { persist = true } = {}) {
    const normalized = normalizeLanguage(language) || "en";
    if (persist) {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem(STORAGE_KEY, normalized);
          this.hasLocalOverride = true;
        }
      } catch {
        // Session fallback
      }
    }
    if (normalized === this.language) return false;
    this.language = normalized;
    this.applyDocumentLanguage();
    for (const listener of this.listeners) listener(normalized);
    return true;
  }

  syncFromWink(state) {
    if (this.hasLocalOverride) return false;
    const platformLanguage = readWinkLanguage(state) || readUrlLanguage();
    if (!platformLanguage) return false;
    return this.setLanguage(platformLanguage, { persist: false });
  }

  t(key, variables = {}) {
    const template = messages[this.language]?.[key] ?? messages.en[key] ?? key;
    return String(template).replace(/\{(\w+)\}/g, (_, name) =>
      variables[name] === undefined || variables[name] === null
        ? `{${name}}`
        : String(variables[name]),
    );
  }

  formatNumber(value) {
    const locale = this.language === "vi" ? "vi-VN" : "en-US";
    return Number(value || 0).toLocaleString(locale);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const i18n = new I18nManager();
export const t = (key, variables) => i18n.t(key, variables);
export { SUPPORTED_LANGUAGES };
