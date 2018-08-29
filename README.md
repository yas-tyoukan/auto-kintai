# これは何
勤怠をcliで入力するためのツール

# 使い方
## 事前準備
```
npm i
npm run installdriver
```

## 環境変数設定
```
export URL=(ログインIDを入力する画面のURL)
export LOGIN_ID=(ログインID)
export LOGIN_PASS=(ログインパスワード)
export WORK_TIME_IN="0900"
export WORK_TIME_OUT="1900"
export BREAK_TIME_IN="1300"
export BREAK_TIME_OUT="1400"
```

## 今日の勤怠をデフォルト値(環境変数設定値)で承認依頼
```
npm run server
```
serverが動いている状態で以下実行
```
npm run test
```

## 日付と勤怠情報を指定
未実装
