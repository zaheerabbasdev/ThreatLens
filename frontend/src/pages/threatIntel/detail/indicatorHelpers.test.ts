import { describe, expect, it } from "vitest";
import { getRelatedIndicatorIds } from "./indicatorHelpers";
import { MOCK_IP_INDICATORS, MOCK_DOMAIN_INDICATORS, MOCK_URL_INDICATORS, MOCK_HASH_INDICATORS } from "@/mocks/indicators";

describe("getRelatedIndicatorIds", () => {
  it("resolves an IP indicator's related domain ids", () => {
    const ip = MOCK_IP_INDICATORS[1]!; // ind_3, has a related domain
    expect(getRelatedIndicatorIds(ip)).toEqual(ip.relatedDomainIds);
  });

  it("merges a domain indicator's related IP and URL ids", () => {
    const domain = MOCK_DOMAIN_INDICATORS[0]!;
    expect(getRelatedIndicatorIds(domain)).toEqual([...domain.relatedIpIds, ...domain.relatedUrlIds]);
  });

  it("resolves a URL indicator's related indicator ids", () => {
    const url = MOCK_URL_INDICATORS[0]!;
    expect(getRelatedIndicatorIds(url)).toEqual(url.relatedIndicatorIds);
  });

  it("returns an empty list for hash indicators, which track no related ids", () => {
    const hash = MOCK_HASH_INDICATORS[0]!;
    expect(getRelatedIndicatorIds(hash)).toEqual([]);
  });
});
