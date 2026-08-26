import { Link } from 'react-router-dom'
import { GithubLogo, XLogo, FacebookLogo, MapTrifold, ArrowSquareOut } from '@phosphor-icons/react'

const footerLinks = {
  'Sản phẩm': [
    { label: 'Bản đồ tương tác 3D', href: '/product/map' },
    { label: 'Ứng dụng di động (iOS & Android)', href: '/product/app' },
    { label: 'Vision AI Classifier', href: '/product/map' },
    { label: 'Danh mục QCVN 41:2019', href: '/docs' },
  ],
  'Giải pháp': [
    { label: 'Dành cho Khảo sát viên', href: '/product/app' },
    { label: 'Dành cho Tài xế lái xe', href: '/product/app' },
    { label: 'Dành cho Nhà phát triển', href: '/docs' },
    { label: 'Cổng Quản Trị Ops Portal', href: 'https://ops.signtrustmap.site', external: true },
  ],
  'Tài liệu & API': [
    { label: 'Tài liệu hướng dẫn API', href: '/docs' },
    { label: 'Geospatial SDK', href: '/docs' },
    { label: 'Mã nguồn GitHub', href: 'https://github.com/SignTrustMap', external: true },
  ],
  'Dự án': [
    { label: 'Về SignTrustMap', href: '/about' },
    { label: 'Bài viết & Cập nhật', href: '/blog' },
    { label: 'Chính sách bảo mật', href: '/privacy' },
    { label: 'Điều khoản sử dụng', href: '/terms' },
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
              className="flex items-center gap-2.5 font-brand font-bold text-lg text-white mb-4 group"
            >
              <div className="w-7 h-7 rounded-[6px] bg-gradient-to-br from-[#00c4de] to-[#007b8b] flex items-center justify-center">
                <MapTrifold size={16} weight="fill" className="text-black" />
              </div>
              <span>
                Sign<span className="text-[#00c4de]">Trust</span>Map
              </span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed max-w-[220px]">
              Hạ tầng bản đồ biển báo giao thông AI-Native hàng đầu Việt Nam.
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
          <p>© {new Date().getFullYear()} SignTrustMap Platform. Bản quyền được bảo lưu.</p>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Tất cả hệ thống hoạt động bình thường
            </span>
            <span>v2.0.0-alpha</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
