"use client";

import { useEffect, useState } from "react";
import { useTradingStore } from "./store/tradingViewStore";

export function UserDebugPanel() {
  const { currentUserId, authTimestamp, selectedAccount, accounts } =
    useTradingStore();
  const [cookieInfo, setCookieInfo] = useState<any>(null);

  useEffect(() => {
    // Get cookie info for debugging
    const updateCookieInfo = () => {
      if (typeof window === "undefined") return;

      try {
        const userInfoCookie = document.cookie
          .split(";")
          .find((cookie) => cookie.trim().startsWith("user_info="));

        const authTimestampCookie = document.cookie
          .split(";")
          .find((cookie) => cookie.trim().startsWith("auth_timestamp="));

        const accessTokenCookie = document.cookie
          .split(";")
          .find((cookie) => cookie.trim().startsWith("accessToken="));

        setCookieInfo({
          hasUserInfo: !!userInfoCookie,
          hasAuthTimestamp: !!authTimestampCookie,
          hasAccessToken: !!accessTokenCookie,
          userInfo: userInfoCookie
            ? JSON.parse(decodeURIComponent(userInfoCookie.split("=")[1]))
            : null,
          authTimestamp: authTimestampCookie
            ? authTimestampCookie.split("=")[1]
            : null,
          accessTokenPreview: accessTokenCookie
            ? accessTokenCookie.split("=")[1].substring(0, 20) + "..."
            : null,
        });
      } catch (error) {
        console.error("Error reading cookies:", error);
      }
    };

    updateCookieInfo();
    const interval = setInterval(updateCookieInfo, 1000);
    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black/90 text-white p-3 rounded-lg text-xs max-w-sm z-50 max-h-96 overflow-y-auto">
      <h4 className="font-bold text-green-400 mb-2">User Debug Panel</h4>
      <div className="space-y-1">
        <div>
          <span className="text-blue-400">Store User ID:</span>{" "}
          {currentUserId || "null"}
        </div>
        <div>
          <span className="text-blue-400">Auth Timestamp:</span>{" "}
          {authTimestamp || "null"}
        </div>
        <div>
          <span className="text-blue-400">Cookie User ID:</span>{" "}
          {cookieInfo?.userInfo?.id || "null"}
        </div>
        <div>
          <span className="text-blue-400">Cookie User Email:</span>{" "}
          {cookieInfo?.userInfo?.email || "null"}
        </div>
        <div>
          <span className="text-blue-400">Cookie Auth Timestamp:</span>{" "}
          {cookieInfo?.authTimestamp || "null"}
        </div>
        <div>
          <span className="text-blue-400">Has Access Token:</span>{" "}
          {cookieInfo?.hasAccessToken ? "Yes" : "No"}
        </div>
        <div>
          <span className="text-blue-400">Access Token Preview:</span>{" "}
          {cookieInfo?.accessTokenPreview || "null"}
        </div>
        <div>
          <span className="text-blue-400">Selected Account:</span>{" "}
          {selectedAccount?.id || "null"}
        </div>
        <div>
          <span className="text-blue-400">Total Accounts:</span>{" "}
          {accounts.length}
        </div>
        <div>
          <span className="text-blue-400">Timestamp:</span>{" "}
          {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
