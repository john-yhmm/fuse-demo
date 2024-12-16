export interface People {
    id: string;
    fullName: string;
    preferredName: string;
    searchName: string;
    isPermittedToLogon: boolean;
    logonName: string;
    isExternalLogonProvider: boolean;
    hashedPassword: string;
    isSystemUser: boolean;
    isEmployee: boolean;
    isSalesPerson: boolean;
    userPreferences: string;
    contactId: string;
    photo: string;
    customFields: string;
    languageId: string;
    lastEditedBy: string;
    validFrom: string;
    validTo: string;
}

export interface PeoplePagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}
