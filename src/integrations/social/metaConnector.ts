import type{SocialConnector}from"./types";const pending=async()=>{throw new Error("Meta OAuth setup required.")};
// TODO: Meta requires a developer app, redirect URI, approved scopes, professional Instagram account where applicable, app review, server-side token encryption, and background sync jobs.
export const metaConnector:SocialConnector={platform:"Instagram / Facebook",connect:pending,disconnect:pending,syncAccount:pending,syncPosts:pending,syncAnalytics:pending};
