import type { Locale } from "./i18n";

export interface Sample {
  id: string;
  label: Partial<Record<Locale, string>> & { en: string };
  code: string;
}

export const SAMPLES: Sample[] = [
  {
    id: "flowchart",
    label: {
      en: "Flowchart (login)",
      ja: "フローチャート（ログイン）",
      "zh-TW": "流程圖（登入）",
      "zh-CN": "流程图（登录）",
      "ko": "플로차트 (로그인)",
      "fr": "Organigramme (connexion)",
      "es": "Diagrama de flujo (inicio de sesión)",
      "de": "Flussdiagramm (Anmeldung)",
      "pt": "Fluxograma (login)",
      "it": "Diagramma di flusso (login)",
      "ru": "Блок-схема (вход)",
    },
    code: `flowchart TD
    A["ユーザーがIDとパスワードを入力"] --> B{"認証情報をDBに照会"}
    B -->|"成功"| C["ホーム画面へ遷移"]
    B -->|"失敗"| D["エラーメッセージを表示"]
    D --> A`,
  },
  {
    id: "sequence",
    label: {
      en: "Sequence",
      ja: "シーケンス図",
      "zh-TW": "循序圖",
      "zh-CN": "时序图",
      "ko": "시퀀스",
      "fr": "Séquence",
      "es": "Secuencia",
      "de": "Sequenz",
      "pt": "Sequência",
      "it": "Sequenza",
      "ru": "Последовательность",
    },
    code: `sequenceDiagram
    participant U as ユーザー
    participant S as システム
    participant DB as データベース
    U->>S: ログイン要求
    S->>DB: 認証情報を照会
    DB-->>S: 結果を返却
    alt 成功
        S-->>U: ホーム画面
    else 失敗
        S-->>U: エラー表示
    end`,
  },
  {
    id: "class",
    label: {
      en: "Class",
      ja: "クラス図",
      "zh-TW": "類別圖",
      "zh-CN": "类图",
      "ko": "클래스",
      "fr": "Classe",
      "es": "Clases",
      "de": "Klasse",
      "pt": "Classe",
      "it": "Classe",
      "ru": "Класс",
    },
    code: `classDiagram
    class User {
      +String name
      +String email
      +login()
      +logout()
    }
    class Order {
      +int id
      +Date date
      +total() float
    }
    User "1" --> "*" Order : places`,
  },
  {
    id: "state",
    label: {
      en: "State",
      ja: "状態遷移図",
      "zh-TW": "狀態圖",
      "zh-CN": "状态图",
      "ko": "상태",
      "fr": "État",
      "es": "Estados",
      "de": "Zustand",
      "pt": "Estado",
      "it": "Stato",
      "ru": "Состояние",
    },
    code: `stateDiagram-v2
    [*] --> 待機
    待機 --> 処理中 : 開始
    処理中 --> 完了 : 成功
    処理中 --> 失敗 : エラー
    完了 --> [*]
    失敗 --> 待機 : 再試行`,
  },
  {
    id: "gantt",
    label: {
      en: "Gantt",
      ja: "ガントチャート",
      "zh-TW": "甘特圖",
      "zh-CN": "甘特图",
      "ko": "간트",
      "fr": "Gantt",
      "es": "Gantt",
      "de": "Gantt",
      "pt": "Gantt",
      "it": "Gantt",
      "ru": "Диаграмма Ганта",
    },
    code: `gantt
    title プロジェクト計画
    dateFormat YYYY-MM-DD
    section 設計
    要件定義      :a1, 2026-06-01, 7d
    基本設計      :a2, after a1, 5d
    section 開発
    実装          :b1, after a2, 14d
    テスト        :b2, after b1, 7d`,
  },
  {
    id: "pie",
    label: {
      en: "Pie",
      ja: "円グラフ",
      "zh-TW": "圓餅圖",
      "zh-CN": "饼图",
      "ko": "파이",
      "fr": "Camembert",
      "es": "Circular",
      "de": "Kreis",
      "pt": "Pizza",
      "it": "Torta",
      "ru": "Круговая",
    },
    code: `pie title 利用ブラウザ
    "Chrome" : 62
    "Safari" : 18
    "Edge" : 12
    "その他" : 8`,
  },
  {
    id: "er",
    label: {
      en: "ER",
      ja: "ER図",
      "zh-TW": "實體關係圖",
      "zh-CN": "ER 图",
      "ko": "ER",
      "fr": "ER",
      "es": "ER",
      "de": "ER",
      "pt": "ER",
      "it": "ER",
      "ru": "ER",
    },
    code: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE_ITEM : contains
    CUSTOMER {
      string name
      string email
    }
    ORDER {
      int id
      date created
    }`,
  },
  {
    id: "mindmap",
    label: {
      en: "Mindmap",
      ja: "マインドマップ",
      "zh-TW": "心智圖",
      "zh-CN": "思维导图",
      "ko": "마인드맵",
      "fr": "Carte mentale",
      "es": "Mapa mental",
      "de": "Mindmap",
      "pt": "Mapa mental",
      "it": "Mappa mentale",
      "ru": "Интеллект-карта",
    },
    code: `mindmap
  root((Mermaid))
    描画
      フローチャート
      シーケンス図
    用途
      設計書
      ドキュメント`,
  },
];

export const DEFAULT_CODE = SAMPLES[0].code;
