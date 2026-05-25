import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class OrcidService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private orcidApiUrl: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.clientId = this.configService.get<string>('ORCID_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('ORCID_CLIENT_SECRET');
    this.redirectUri = this.configService.get<string>('ORCID_REDIRECT_URI');
    this.orcidApiUrl = 'https://pub.orcid.org/v3.0';
  }

  getAuthUrl() {
    return `https://orcid.org/oauth/authorize?client_id=${this.clientId}&response_type=code&scope=/read-public&redirect_uri=${this.redirectUri}`;
  }

  async handleCallback(code: string, advisorId: string) {
    try {
      const response = await axios.post(
        'https://orcid.org/oauth/token',
        new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.redirectUri,
        }),
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );

      const { orcid, access_token, refresh_token } = response.data;

      // Update Advisor Profile
      await this.prisma.advisorProfile.update({
        where: { id: advisorId },
        data: {
          orcidId: orcid,
          orcidAccessToken: access_token,
          orcidRefreshToken: refresh_token,
        },
      });

      // Fetch publications
      await this.syncPublications(advisorId, orcid, access_token);

      return { orcid };
    } catch (error) {
      throw new HttpException('Error in ORCID OAuth', HttpStatus.BAD_REQUEST);
    }
  }

  async syncPublications(advisorId: string, orcid: string, accessToken: string) {
    try {
      const response = await axios.get(`${this.orcidApiUrl}/${orcid}/works`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      const works = response.data.group;

      for (const group of works) {
        const workSummary = group['work-summary'][0];
        const title = workSummary.title.title.value;
        const year = workSummary['publication-date']?.year?.value;
        const doi = workSummary['external-ids']?.['external-id']?.find(
          (id: any) => id['external-id-type'] === 'doi',
        )?.['external-id-value'];

        await this.prisma.orcidPublication.create({
          data: {
            advisorId,
            title,
            year: year ? parseInt(year) : null,
            doi,
            journal: workSummary['journal-title']?.value,
          },
        });
      }
    } catch (error) {
      console.error('Error syncing publications', error);
    }
  }
}
