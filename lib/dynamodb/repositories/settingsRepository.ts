import { 
  PutCommand, 
  GetCommand, 
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { dynamoDB, DYNAMODB_TABLE_NAME, getTimestamp } from '@/lib/dynamodb';
import { 
  SettingsEntity,
  BusinessSettings,
  DeliverySettings,
  PaymentSettings,
  SiteSettings,
} from '@/types/dynamodb';

const SETTINGS_PK = 'SETTINGS';
const SETTINGS_SK = 'SETTINGS';

export class SettingsRepository {
  /**
   * Get settings (create default if not exists)
   */
  async getSettings(): Promise<SettingsEntity> {
    const result = await dynamoDB.send(new GetCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: SETTINGS_PK,
        SK: SETTINGS_SK,
      },
    }));

    if (result.Item) {
      return result.Item as SettingsEntity;
    }

    // Create default settings
    return this.createDefaultSettings();
  }

  /**
   * Create default settings
   */
  private async createDefaultSettings(): Promise<SettingsEntity> {
    const timestamp = getTimestamp();

    const settings: SettingsEntity = {
      PK: SETTINGS_PK,
      SK: SETTINGS_SK,
      type: 'SETTINGS',
      business: {
        businessName: 'My E-Commerce Store',
        phone: '+250700000000',
        email: 'info@example.com',
      },
      delivery: {
        kigaliFee: 2000,
        outsideKigaliFee: 5000,
      },
      payment: {
        mtnNumber: '+250780000000',
        airtelNumber: '+250730000000',
        paymentInstructions: 'Please send payment to the provided number and submit the transaction ID.',
      },
      site: {
        logoUrl: '',
        socialLinks: {
          facebook: '',
          instagram: '',
          twitter: '',
        },
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await dynamoDB.send(new PutCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Item: settings,
    }));

    return settings;
  }

  /**
   * Update business settings
   */
  async updateBusinessSettings(business: Partial<BusinessSettings>): Promise<SettingsEntity> {
    const timestamp = getTimestamp();
    const settings = await this.getSettings();

    const updatedBusiness = {
      ...settings.business,
      ...business,
    };

    await dynamoDB.send(new UpdateCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: SETTINGS_PK,
        SK: SETTINGS_SK,
      },
      UpdateExpression: 'SET #business = :business, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#business': 'business',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':business': updatedBusiness,
        ':updatedAt': timestamp,
      },
    }));

    return this.getSettings();
  }

  /**
   * Update delivery settings
   */
  async updateDeliverySettings(delivery: Partial<DeliverySettings>): Promise<SettingsEntity> {
    const timestamp = getTimestamp();
    const settings = await this.getSettings();

    const updatedDelivery = {
      ...settings.delivery,
      ...delivery,
    };

    await dynamoDB.send(new UpdateCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: SETTINGS_PK,
        SK: SETTINGS_SK,
      },
      UpdateExpression: 'SET #delivery = :delivery, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#delivery': 'delivery',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':delivery': updatedDelivery,
        ':updatedAt': timestamp,
      },
    }));

    return this.getSettings();
  }

  /**
   * Update payment settings
   */
  async updatePaymentSettings(payment: Partial<PaymentSettings>): Promise<SettingsEntity> {
    const timestamp = getTimestamp();
    const settings = await this.getSettings();

    const updatedPayment = {
      ...settings.payment,
      ...payment,
    };

    await dynamoDB.send(new UpdateCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: SETTINGS_PK,
        SK: SETTINGS_SK,
      },
      UpdateExpression: 'SET #payment = :payment, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#payment': 'payment',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':payment': updatedPayment,
        ':updatedAt': timestamp,
      },
    }));

    return this.getSettings();
  }

  /**
   * Update site settings
   */
  async updateSiteSettings(site: Partial<SiteSettings>): Promise<SettingsEntity> {
    const timestamp = getTimestamp();
    const settings = await this.getSettings();

    const updatedSite = {
      ...settings.site,
      ...site,
      socialLinks: {
        ...settings.site.socialLinks,
        ...site.socialLinks,
      },
    };

    await dynamoDB.send(new UpdateCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        PK: SETTINGS_PK,
        SK: SETTINGS_SK,
      },
      UpdateExpression: 'SET #site = :site, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#site': 'site',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':site': updatedSite,
        ':updatedAt': timestamp,
      },
    }));

    return this.getSettings();
  }

  /**
   * Update all settings at once
   */
  async updateAllSettings(data: {
    business?: Partial<BusinessSettings>;
    delivery?: Partial<DeliverySettings>;
    payment?: Partial<PaymentSettings>;
    site?: Partial<SiteSettings>;
  }): Promise<SettingsEntity> {
    const timestamp = getTimestamp();
    const settings = await this.getSettings();

    const updateParts: string[] = [];
    const expressionValues: Record<string, any> = {};
    const expressionNames: Record<string, string> = {};

    if (data.business) {
      updateParts.push('#business = :business');
      expressionValues[':business'] = {
        ...settings.business,
        ...data.business,
      };
      expressionNames['#business'] = 'business';
    }

    if (data.delivery) {
      updateParts.push('#delivery = :delivery');
      expressionValues[':delivery'] = {
        ...settings.delivery,
        ...data.delivery,
      };
      expressionNames['#delivery'] = 'delivery';
    }

    if (data.payment) {
      updateParts.push('#payment = :payment');
      expressionValues[':payment'] = {
        ...settings.payment,
        ...data.payment,
      };
      expressionNames['#payment'] = 'payment';
    }

    if (data.site) {
      updateParts.push('#site = :site');
      expressionValues[':site'] = {
        ...settings.site,
        ...data.site,
        socialLinks: {
          ...settings.site.socialLinks,
          ...data.site.socialLinks,
        },
      };
      expressionNames['#site'] = 'site';
    }

    if (updateParts.length > 0) {
      updateParts.push('#updatedAt = :updatedAt');
      expressionValues[':updatedAt'] = timestamp;
      expressionNames['#updatedAt'] = 'updatedAt';

      await dynamoDB.send(new UpdateCommand({
        TableName: DYNAMODB_TABLE_NAME,
        Key: {
          PK: SETTINGS_PK,
          SK: SETTINGS_SK,
        },
        UpdateExpression: `SET ${updateParts.join(', ')}`,
        ExpressionAttributeValues: expressionValues,
        ExpressionAttributeNames: expressionNames,
      }));
    }

    return this.getSettings();
  }

  /**
   * Get delivery fee for zone
   */
  async getDeliveryFee(zone: 'kigali' | 'outside_kigali'): Promise<number> {
    const settings = await this.getSettings();
    return zone === 'kigali' 
      ? settings.delivery.kigaliFee 
      : settings.delivery.outsideKigaliFee;
  }

  /**
   * Get payment numbers
   */
  async getPaymentNumbers(): Promise<{ mtn: string; airtel: string }> {
    const settings = await this.getSettings();
    return {
      mtn: settings.payment.mtnNumber,
      airtel: settings.payment.airtelNumber,
    };
  }

  /**
   * Get payment instructions
   */
  async getPaymentInstructions(): Promise<string> {
    const settings = await this.getSettings();
    return settings.payment.paymentInstructions;
  }
}

// Export singleton instance
export const settingsRepository = new SettingsRepository();