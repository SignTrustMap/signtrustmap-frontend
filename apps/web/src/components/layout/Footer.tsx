import { Link } from 'react-router-dom'
import { GithubLogo, XLogo, FacebookLogo, ArrowSquareOut } from '@phosphor-icons/react'

const footerLinks = {
  'Sản phẩm': [
    { label: 'Bản đồ biển báo GIS', href: '/product/map' },
    { label: 'Ứng dụng khảo sát & dẫn đường', href: '/product/app' },
    { label: 'Pipeline AI (YOLO12 + CLIP)', href: '/product/map' },
    { label: 'Danh mục chuẩn QCVN 41:2019', href: '/docs' },
  ],
  'Giải pháp': [
    { label: 'Dành cho Khảo sát viên (Surveyor)', href: '/product/app' },
    { label: 'Dành cho Người kiểm duyệt (Reviewer)', href: 'https://ops.signtrustmap.site', external: true },
    { label: 'Dành cho Tài xế & Dẫn đường', href: '/product/app' },
    { label: 'Cổng Quản trị & Điều hành Ops', href: 'https://ops.signtrustmap.site', external: true },
  ],
  'Tài liệu & MLOps': [
    { label: 'Tài liệu kỹ thuật API', href: '/docs' },
    { label: 'Quy trình Active Learning', href: '/docs' },
    { label: 'Mã nguồn GitHub', href: 'https://github.com/SignTrustMap', external: true },
  ],
  'Dự án': [
    { label: 'Về dự án SignTrustMap', href: '/about' },
    { label: 'Blog & Tin tức', href: '/blog' },
    { label: 'Chính sách bảo mật', href: '/privacy' },
    { label: 'Điều khoản dịch vụ', href: '/terms' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#020506] text-gray-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Top: Logo & Link Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="col-span-2 md:col-span-1">
            <Link
              to="/"
              className="flex items-center gap-3 font-brand font-bold text-xl text-white mb-4 group"
            >
              <img
                src="/brand/brand_logo_nobg.svg"
                alt="SignTrustMap Logo"
                className="w-8 h-8 object-contain"
              />
              <span className="font-sans">
                Sign<span className="text-[#00c4de]">Trust</span>Map
              </span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed max-w-[220px]">
              Nền tảng kết hợp AI và cộng đồng để xây dựng cơ sở dữ liệu biển báo giao thông tin cậy.
            </p>

            {/* Social Icons */}
            <div className="flex gap-2.5 mt-5">
              {[
                { Icon: GithubLogo, href: 'https://github.com/SignTrustMap', label: 'GitHub' },
                { Icon: XLogo, href: 'https://x.com', label: 'X / Twitter' },
                { Icon: FacebookLogo, href: 'https://facebook.com', label: 'Facebook' },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 flex items-center justify-center rounded-[8px] border border-white/10 text-gray-400 hover:text-[#00c4de] hover:border-[#00c4de]/40 bg-white/[0.02] transition-colors"
                >
                  <Icon size={16} weight="bold" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-gray-200 mb-4">
                {section}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {'external' in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-400 hover:text-[#00c4de] transition-colors inline-flex items-center gap-1 group"
                      >
                        <span>{link.label}</span>
                        <ArrowSquareOut size={11} className="opacity-60 group-hover:opacity-100" />
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-xs text-gray-400 hover:text-[#00c4de] transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} SignTrustMap Project. Bản quyền được bảo lưu.</p>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Tất cả hệ thống hoạt động bình thường
            </span>
            <span>v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
