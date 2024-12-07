import { DateTime } from "luxon";
export interface BankAccount {
    id: string;
    bankAccountName: string;
    bankAccountBranch: string;
    bankAccountCode: string;
    bankAccountNumber: string;
    bankInternationalCode: string;
    lastEditedBy: string;
    validFrom: string;
    validTo: string;
}
export interface BankAccountPagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}