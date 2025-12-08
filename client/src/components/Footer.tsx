import { APP_TITLE } from "@/const";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-card">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-3">{APP_TITLE}</h3>
            <p className="text-sm text-muted-foreground">
              電車車両内への動画投影サービス
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">サービス</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>無料体験（20秒）</li>
              <li>有料サービス（1分間・5,000円）</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">お問い合わせ</h4>
            <p className="text-sm text-muted-foreground">
              ご不明な点がございましたら、<br />
              お気軽にお問い合わせください。
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} {APP_TITLE}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
