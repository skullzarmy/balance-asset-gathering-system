/**
 * Footer Component
 *
 * A minimal reusable footer component that displays copyright information
 * and FAFO lab attribution.
 *
 * @module UI
 * @category Layout
 */

import React from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();
    const yearDisplay =
        currentYear === siteConfig.copyright.startYear
            ? currentYear
            : `${siteConfig.copyright.startYear}-${currentYear}`;

    return (
        <footer className="flex flex-col justify-center items-center bg-card-background text-sm p-4 w-full z-40 shadow mt-auto gap-2">
            <div className="flex items-center gap-4 flex-wrap justify-center">
                <Link
                    href="/privacy"
                    className="text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                    Privacy
                </Link>
                <Link
                    href="https://github.com/skullzarmy/balance-asset-gathering-system"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                    GitHub
                </Link>
            </div>
            <span className="text-muted-foreground">
                © {yearDisplay} {siteConfig.name}. All rights reserved. a{" "}
                <Link href="https://fafolab.xyz" className="text-foreground underline underline-offset-2">
                    FAFO <span className="line-through">lab</span>
                </Link>{" "}
                joint.
            </span>
        </footer>
    );
};

export default Footer;
