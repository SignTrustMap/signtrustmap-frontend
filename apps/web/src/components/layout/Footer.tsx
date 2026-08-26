import { Link } from 'react-router-dom'
import { GithubLogo, XLogo, FacebookLogo } from '@phosphor-icons/react'

const footerLinks = {
  Product: [
    { label: 'Bản đồ biển báo', href: '/product/map' },
    { label: 'Tải ứng dụng', href: '/product/app' },
  ],
  Company: [
    { label: 'Về chúng tôi', href: '/about' },
    { label: 'Blog', href: '/blog' },
  ],
  Developers: [
    { label: 'Tài liệu API', href: '/docs' },
    { label: 'GitHub', href: 'https://github.com/SignTrustMap', external: true },
  ],
  Legal: [
    { label: 'Chính sách bảo mật', href: '/privacy' },
    { label: 'Điều khoản dịch vụ', href: '/terms' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-[#E8E4E3] bg-[#F8F7F7]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Top: logo + grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 font-brand font-bold text-lg text-[#007b8b] mb-4">
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="6" fill="#007b8b" />
                <path d="M14 6 L20 10 L20 18 L14 22 L8 18 L8 10 Z" stroke="white" strokeWidth="1.5" fill="none" />
                <circle cx="14" cy="14" r="2.5" fill="white" />
              </svg>
              SignTrustMap
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-[200px]">
              Bản đồ biển báo giao thông đáng tin cậy cho Việt Nam.
            </p>

            {/* Social icons */}
            <div className="flex gap-3 mt-5">
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
                  className="w-8 h-8 flex items-center justify-center rounded-[8px] border border-[#E8E4E3] text-gray-500 hover:text-[#007b8b] hover:border-[#007b8b] transition-colors bg-white"
                >
                  <Icon size={16} weight="bold" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">{section}</h3>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    {'external' in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-600 hover:text-[#007b8b] transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm text-gray-600 hover:text-[#007b8b] transition-colors"
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

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-[#E8E4E3] flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} SignTrustMap. Bảo lưu mọi quyền.</p>
          <p>Dữ liệu biển báo do cộng đồng đóng góp và xác thực.</p>
        </div>
      </div>
    </footer>
  )
}
