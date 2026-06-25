export interface Sample {
  id: string;
  label: string;
  code: string;
}

export const SAMPLES: Sample[] = [
  {
    id: "flowchart",
    label: "フローチャート（ログイン）",
    code: `flowchart TD
    A["ユーザーがIDとパスワードを入力"] --> B{"認証情報をDBに照会"}
    B -->|"成功"| C["ホーム画面へ遷移"]
    B -->|"失敗"| D["エラーメッセージを表示"]
    D --> A`,
  },
  {
    id: "sequence",
    label: "シーケンス図",
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
    label: "クラス図",
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
    label: "状態遷移図",
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
    label: "ガントチャート",
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
    label: "円グラフ",
    code: `pie title 利用ブラウザ
    "Chrome" : 62
    "Safari" : 18
    "Edge" : 12
    "その他" : 8`,
  },
  {
    id: "er",
    label: "ER図",
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
    label: "マインドマップ",
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
