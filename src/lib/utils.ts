import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function encodeData(data: any): string {
    try {
        return btoa(encodeURIComponent(JSON.stringify(data)));
    } catch (error) {
        console.error("Failed to encode data:", error);
        return "";
    }
}

export function decodeData<T>(encoded: string): T | null {
    try {
        return JSON.parse(decodeURIComponent(atob(encoded))) as T;
    } catch (error) {
        console.error("Failed to decode data:", error);
        return null;
    }
}
