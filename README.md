# Windows11 Lab — UEFI Setup Simulator

本プロジェクトは、Windows 11 を搭載するPCの **UEFI BIOSセットアップ画面の操作体験** をブラウザで再現するものです。現段階では **OS本体、ブートローダー、実機のBIOS/UEFIは実装していません**。

> **重要**: これは本物のBIOSやUEFIファームウェアではありません。実際のCPU、メモリー、SSD、TPM、Secure Bootキー、ファン等には一切アクセスしません。画面上のハードウェア情報は架空のサンプル値です。変更内容はブラウザの `localStorage` にのみ保存されます。

## 起動方法

外部ライブラリやビルド処理は不要です。リポジトリの `index.html` をブラウザで開きます。ブラウザにより `file://` 環境の保存動作が異なるため、可能ならローカルサーバーを利用してください。

```bash
python -m http.server 8000
```

その後、`http://localhost:8000` にアクセスします。GitHub Pagesを有効にすればスマートフォンからもアクセスできます（GitHub Settings → Pages → Deploy from a branch → main / root）。

## 実装済みの範囲

- AMI Aptio系の古典的なUEFI Setupを参考にした、6タブ・右側ヘルプ・下部ステータスバーのUI
- Main：仮想ファームウェア/CPU/メモリー情報、日付、時刻
- Advanced：CPU、メモリー、SATA/NVMe、USB、電源、TPM、PXE、ハードウェアモニター
- Chipset：映像、PCI Express、オンボード機器、プラットフォーム情報
- Security：デモ用管理者/ユーザーパスワード、Secure Boot状態、仮想キーフラグ
- Boot：Fast Boot、CSM、優先デバイス、Boot Override（SSD / USB / PXE）
- Save & Exit：変更保存・破棄・初期化・ユーザー既定値・再起動
- 設定は未保存ドラフトと保存済みNVRAMを分離、再起動してもブラウザ内に保持
- Boot Priorityの入れ替え、Secure BootとCSMの排他、設定項目の依存関係
- 再起動時の仮想POST画面、OS未実装時のブート失敗画面
- PC用ショートカットとスマートフォン用のタッチキー
- ブラウザ全画面表示への切り替え（ブラウザが許可する場合）

### 操作

| 入力 | 動作 |
|---|---|
| `←` / `→` | メインタブ切り替え |
| `↑` / `↓` | 項目選択 |
| `Enter` | 項目編集・メニュー進入 |
| `+` / `-` | 選択式項目の値変更 |
| `Esc` | メニューを戻る / BIOSから戻る |
| `F1` | ヘルプ |
| `F9` | 最適化された初期値を読み込む |
| `F10` | 設定を保存し再起動 |
| `F2` / `Delete` | POST/ブート失敗中にBIOSに入る |

タッチ端末では各タブ・項目をタップし、画面下の矢印・Enter・Esc・F1/F9/F10ボタンを使用します。

### パスワードの注意

パスワードはデモ専用です。実用パスワードを入力しないでください。対応する安全なブラウザーコンテキスト（HTTPS/localhost等）では WebCrypto の SHA-256 でハッシュ化したデモ値を保存しますが、これは実際のファームウェア保護、強固な認証、OS保護を提供しません。忘れた場合はPOST画面から **Reset Virtual NVRAM** を選ぶと、すべての仮想設定を削除できます。

## 現段階で実装しないもの

- Windows 11 本体、Windows Boot Manager、BDS/PEI/DXEなどの実際のUEFIブート処理
- 実際のCPU命令実行、実メモリー、SSD/USBの読み書き、TPM暗号処理、Secure Boot署名検証
- 実機センサー、実BIOS書き換え、BIOSアップデート、物理パスワード保護
- 特定のメーカー/型番に依存する個別BIOSの完全互換性

## ファイル構成

- `index.html` — 画面の構造
- `styles.css` — PC/スマホのレイアウトとUEFIテーマ
- `app.js` — 画面遷移・各設定・仮想NVRAM・キーボード/タッチ操作

`index.html` → `styles.css` → `app.js` の順でブラウザから読み込まれます。サーバー側コードや外部CDNは不要です。

## 検証

Chromiumヘッドレス環境でデスクトップ/モバイルの基本操作、設定変更、F10保存→再エントリー、Boot Priority入れ替え、CSMとSecure Bootの排他、F9初期化、OS未搭載時の起動失敗、スマホでのF1ヘルプ開閉を確認済みです。テスト中はブラウザの通信制限のため、ページをメモリー上で読み込み、`localStorage` を同等のテスト実装に差し替えています。GitHub Pages上での実機ブラウザ検証は別途必要です。