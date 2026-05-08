"use client";

import Link from "next/link";
import { Globe, Mail, ExternalLink } from "lucide-react";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer
      className="border-t pt-24 pb-12"
      style={{
        borderColor: "var(--color-border)",
        background: "var(--color-bg-soft)",
      }}
    >
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="no-underline group">
              <Logo className="mb-4" />
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              Real-Time Visual Intelligence for Learning. Your AI-powered learning companion.
            </p>
            <div className="flex gap-2 mt-5">
              {[Globe, Mail, ExternalLink].map((Icon, i) => (
                <button key={i} className="btn-icon" style={{ width: 36, height: 36 }}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            {
              title: "Product",
              links: [
                { label: "Live Sessions", href: "/session" },
              ],
            },
            {
              title: "Resources",
              links: [
                { label: "How It Works", href: "#how-it-works" },
                { label: "Documentation", href: "#" },
                { label: "API", href: "#" },
                { label: "Blog", href: "#" },
              ],
            },
            {
              title: "Company",
              links: [
                { label: "About", href: "#" },
                { label: "Careers", href: "#" },
                { label: "Privacy", href: "#" },
                { label: "Terms", href: "#" },
              ],
            },
          ].map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-sm mb-4">{section.title}</h4>
              <ul className="space-y-2.5 list-none p-0 m-0">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm no-underline transition-colors duration-200"
                      style={{ color: "var(--color-text-secondary)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "var(--color-primary)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "var(--color-text-secondary)")
                      }
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div
          className="border-t mt-24 pt-12 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: "var(--color-border)" }}
        >
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            © {new Date().getFullYear()} Synap. All rights reserved.
          </p>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Built with ❤️ for learners everywhere
          </p>
        </div>
      </div>
    </footer>
  );
}
