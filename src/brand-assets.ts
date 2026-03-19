import anthropicLogo from './assets/logos/anthropic.svg';
import awsLogo from './assets/logos/aws.svg';
import bitwardenLogo from './assets/logos/bitwarden.svg';
import cloudflareLogo from './assets/logos/cloudflare.svg';
import denoLogo from './assets/logos/deno.svg';
import dockerLogo from './assets/logos/docker.svg';
import gatherLogo from './assets/logos/gather.svg';
import githubBlackLogo from './assets/logos/github-black.svg';
import googleCloudLogo from './assets/logos/google-cloud.svg';
import googleWorkspaceLogo from './assets/logos/google-workspace.svg';
import hashicorpLogo from './assets/logos/hashicorp.svg';
import magicpodLogo from './assets/logos/magicpod.svg';
import microsoftLogo from './assets/logos/microsoft.svg';
import miroLogo from './assets/logos/miro.svg';
import moneyForwardLogo from './assets/logos/money-forward.svg';
import nodejsLogo from './assets/logos/nodejs.svg';
import notionLogo from './assets/logos/notion.svg';
import openaiLogo from './assets/logos/openai.svg';
import pagerdutyLogo from './assets/logos/pagerduty.svg';
import sendgridLogo from './assets/logos/sendgrid.svg';
import slackLogo from './assets/logos/slack.svg';
import zoomLogo from './assets/logos/zoom.svg';

export interface BrandAsset {
  alt: string;
  src: string;
}

export const brandAssets: Record<string, BrandAsset> = {
  notion: {
    alt: 'Notion',
    src: notionLogo,
  },
  openai: {
    alt: 'OpenAI',
    src: openaiLogo,
  },
  github: {
    alt: 'GitHub',
    src: githubBlackLogo,
  },
  hashicorp: {
    alt: 'HashiCorp',
    src: hashicorpLogo,
  },
  anthropic: {
    alt: 'Anthropic',
    src: anthropicLogo,
  },
  pagerduty: {
    alt: 'PagerDuty',
    src: pagerdutyLogo,
  },
  aws: {
    alt: 'AWS',
    src: awsLogo,
  },
  bitwarden: {
    alt: 'Bitwarden',
    src: bitwardenLogo,
  },
  cloudflare: {
    alt: 'Cloudflare',
    src: cloudflareLogo,
  },
  deno: {
    alt: 'Deno',
    src: denoLogo,
  },
  docker: {
    alt: 'Docker',
    src: dockerLogo,
  },
  'google-cloud': {
    alt: 'Google Cloud',
    src: googleCloudLogo,
  },
  'google-workspace': {
    alt: 'Google Workspace',
    src: googleWorkspaceLogo,
  },
  gather: {
    alt: 'Gather',
    src: gatherLogo,
  },
  magicpod: {
    alt: 'MagicPod',
    src: magicpodLogo,
  },
  microsoft365: {
    alt: 'Microsoft 365',
    src: microsoftLogo,
  },
  miro: {
    alt: 'Miro',
    src: miroLogo,
  },
  'money-forward': {
    alt: 'Money Forward',
    src: moneyForwardLogo,
  },
  nodejs: {
    alt: 'Node.js',
    src: nodejsLogo,
  },
  sendgrid: {
    alt: 'SendGrid',
    src: sendgridLogo,
  },
  slack: {
    alt: 'Slack',
    src: slackLogo,
  },
  zoom: {
    alt: 'Zoom',
    src: zoomLogo,
  },
};
