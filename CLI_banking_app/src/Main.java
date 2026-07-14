import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

/*
 * Main class - Command Line Interface for the banking app.
 * Provides a menu-driven console for Admins and Customers to interact
 * with the Bank, Accounts, Customer, and Admin classes.
 */
public class Main {

    private static final Scanner scanner = new Scanner(System.in);
    private static final Bank bank = new Bank();

    public static void main(String[] args) {
        seedTestCustomers();
        System.out.println("================================");
        System.out.println("          Banking 101");
        boolean running = true;
        while (running) {
            System.out.println("================================");
            System.out.println("1. Create Account");
            System.out.println("2. Login as Admin");
            System.out.println("3. Login as Customer");
            System.out.println("4. Exit");
            System.out.println("================================");
            System.out.print("Choose an option: ");

            switch (scanner.nextLine().trim()) {
                case "1": createAccountMenu(); break;
                case "2": adminLogin(); break;
                case "3": customerLogin(); break;
                case "4": running = false; System.out.println("Byebye :)"); break;
                default: System.out.println("Invalid option. Please enter a choice between 1-4.");
            }
        }
        scanner.close();
    }

    private static void seedTestCustomers() {
        if (findCustomer("C001") != null) {
            return;
        }

        Customer Sonia = new Customer("C001", "pass123", "Sonia Jain", "sonia@example.com", "555-0101", "New York", 10001);
        Customer Nevil = new Customer("C002", "pass123", "Nevil Johnson", "nevil@example.com", "555-0102", "Chicago", 60601);
        Customer Bill = new Customer("C003", "pass123", "Carla Gomez", "carla@example.com", "555-0103", "Los Angeles", 90001);

        bank.getCustomers().add(Sonia);
        bank.getCustomers().add(Nevil);
        bank.getCustomers().add(Bill);

        System.out.println("Loaded 3 test customers for demo.");
    }

    // Create Account Menu
    private static void createAccountMenu() {
        System.out.println("\n--- Create Account ---");
        System.out.println("1. Admin");
        System.out.println("2. Customer");
        System.out.print("Choose account type: ");

        String typeChoice = scanner.nextLine().trim();
        boolean isAdmin;
        if (typeChoice.equals("1")) {
            isAdmin = true;
        } else if (typeChoice.equals("2")) {
            isAdmin = false;
        } else {
            System.out.println("Invalid option.");
            return;
        }

        System.out.print("Customer ID: ");
        String customerId = scanner.nextLine().trim();

        if (findCustomer(customerId) != null) {
            System.out.println("A user with that Customer ID already exists.");
            return;
        }

        System.out.print("Password: ");
        String password = scanner.nextLine().trim();
        System.out.print("Name: ");
        String name = scanner.nextLine().trim();
        System.out.print("Email: ");
        String email = scanner.nextLine().trim();
        System.out.print("Phone Number: ");
        String phoneNumber = scanner.nextLine().trim();
        System.out.print("Branch Location: ");
        String branchLocation = scanner.nextLine().trim();
        int postalCode = readInt("Postal Code: ");

        if (isAdmin) {
            System.out.print("Admin ID: ");
            String adminId = scanner.nextLine().trim();
            System.out.print("Admin Password: ");
            String adminPassword = scanner.nextLine().trim();

            Admin admin = new Admin(customerId, password, name, email, phoneNumber, branchLocation, postalCode, adminId, adminPassword, bank);
            bank.getCustomers().add(admin);
            System.out.println("Admin account created successfully");
        } else {
            Customer customer = new Customer(customerId, password, name, email, phoneNumber, branchLocation, postalCode);
            bank.getCustomers().add(customer);
            System.out.println("Customer account created successfully");
        }
    }

    // Admin Menu Login
    private static void adminLogin() {
        System.out.println("\n--- Admin Login ---");
        System.out.print("Admin ID: ");
        String adminId = scanner.nextLine().trim();
        System.out.print("Password: ");
        String password = scanner.nextLine().trim();

        Admin admin = bank.authenticateAdmin(adminId, password);
        if (admin == null) {
            System.out.println("Invalid admin credentials.");
            return;
        }

        System.out.println("Welcome, " + admin.getName());
        adminMenu(admin);
    }

    private static void adminMenu(Admin admin) {
        boolean loggedIn = true;
        while (loggedIn) {
            System.out.println("\n--- Admin Menu ---");
            System.out.println("1. Register Customer");
            System.out.println("2. Create Account");
            System.out.println("3. Assign Account to Customer");
            System.out.println("4. View All Customers");
            System.out.println("5. View All Accounts");
            System.out.println("6. Delete Customer");
            System.out.println("7. Delete Account");
            System.out.println("8. Freeze Customer Account");
            System.out.println("9. Unfreeze Customer Account");
            System.out.println("10. Logout");
            System.out.print("Choose an option: ");

            switch (scanner.nextLine().trim()) {
                case "1": adminRegisterCustomer(admin); break;
                case "2": adminCreateAccount(admin); break;
                case "3": adminAssignAccount(admin); break;
                case "4": admin.seeAllCustomers(); break;
                case "5": admin.seeAllAccounts(); break;
                case "6": adminDeleteCustomer(admin); break;
                case "7": adminDeleteAccount(admin); break;
                case "8": adminSetFrozen(true); break;
                case "9": adminSetFrozen(false); break;
                case "10": loggedIn = false; System.out.println("Logged out."); break;
                default: System.out.println("Invalid option. Please enter a choice between 1-10.");
            }
        }
    }

    // Admin Menu Functions
    private static void adminRegisterCustomer(Admin admin) {
        System.out.println("\n--- Register Customer ---");
        System.out.print("Customer ID: ");
        String customerId = scanner.nextLine().trim();

        if (findCustomer(customerId) != null) {
            System.out.println("A user with that Customer ID already exists.");
            return;
        }

        System.out.print("Password: ");
        String password = scanner.nextLine().trim();
        System.out.print("Name: ");
        String name = scanner.nextLine().trim();
        System.out.print("Email: ");
        String email = scanner.nextLine().trim();
        System.out.print("Phone Number: ");
        String phoneNumber = scanner.nextLine().trim();
        System.out.print("Branch Location: ");
        String branchLocation = scanner.nextLine().trim();
        int postalCode = readInt("Postal Code: ");

        Customer customer = new Customer(customerId, password, name, email, phoneNumber, branchLocation, postalCode);
        admin.registerCustomer(customer);
    }

    private static void adminCreateAccount(Admin admin) {
        System.out.println("\n--- Create Account ---");
        System.out.print("Account Type (e.g. Checking, Savings): ");
        String accountType = scanner.nextLine().trim();
        System.out.print("Account Number: ");
        String accountNumber = scanner.nextLine().trim();
        System.out.print("Primary Owner Name: ");
        String primaryOwner = scanner.nextLine().trim();
        System.out.print("Routing Number: ");
        String routingNumber = scanner.nextLine().trim();
        double balance = readDouble("Initial Balance: ");
        boolean directDeposit = readBoolean("Enable Direct Deposit? (y/n): ");
        double apy = readDouble("APY: ");

        Accounts account = new Accounts(accountType, accountNumber, primaryOwner, new ArrayList<>(), routingNumber, balance, directDeposit, apy);
        admin.createAccount(account);
    }

    private static void adminAssignAccount(Admin admin) {
        System.out.println("\n--- Assign Account to Customer ---");
        System.out.print("Customer ID: ");
        String customerId = scanner.nextLine().trim();
        System.out.print("Account Number: ");
        String accountNumber = scanner.nextLine().trim();

        Accounts account = findAccount(accountNumber);
        if (account == null) {
            System.out.println("Account number not found.");
            return;
        }

        admin.assignAccountToCustomer(customerId, account);
    }

    private static void adminDeleteCustomer(Admin admin) {
        System.out.print("\nCustomer ID to delete: ");
        String customerId = scanner.nextLine().trim();
        admin.deleteCustomer(customerId);
    }

    private static void adminDeleteAccount(Admin admin) {
        System.out.print("\nAccount Number to delete: ");
        String accountNumber = scanner.nextLine().trim();
        admin.deleteAccount(accountNumber);
    }

    private static void adminSetFrozen(boolean freeze) {
        System.out.print("\nCustomer ID: ");
        String customerId = scanner.nextLine().trim();
        Customer customer = findCustomer(customerId);
        if (customer == null) {
            System.out.println("Customer not found.");
            return;
        }
        if (freeze) {
            customer.freezeAccount();
            System.out.println("Customer " + customerId + " is now frozen.");
        } else {
            customer.unfreezeAccount();
            System.out.println("Customer " + customerId + " is now unfrozen.");
        }
    }

    // Customer Menu Login
    private static void customerLogin() {
        System.out.println("\n--- Customer Login ---");
        System.out.print("Customer ID: ");
        String customerId = scanner.nextLine().trim();
        System.out.print("Password: ");
        String password = scanner.nextLine().trim();

        Customer customer = bank.authenticateCustomer(customerId, password);
        if (customer == null) {
            System.out.println("Invalid customer credentials.");
            return;
        }

        System.out.println("Welcome, " + customer.getName());
        customerMenu(customer);
    }

    private static void customerMenu(Customer customer) {
        boolean loggedIn = true;
        while (loggedIn) {
            System.out.println("\n--- Customer Menu ---");
            System.out.println("1. View Profile");
            System.out.println("2. Account Details");
            System.out.println("3. Deposit");
            System.out.println("4. Withdraw");
            System.out.println("5. View Transaction History");
            System.out.println("6. Transfer Funds");
            System.out.println("7. Exit");
            System.out.print("Choose an option: ");

            switch (scanner.nextLine().trim()) {
                case "1": viewProfile(customer); break;
                case "2": viewAccountDetails(customer); break;
                case "3": depositToAccount(customer); break;
                case "4": withdrawFromAccount(customer); break;
                case "5": viewTransactionHistory(customer); break;
                case "6": transferFunds(customer); break;
                case "7": loggedIn = false; System.out.println("Logged out."); break;
                default: System.out.println("Invalid option. Please enter a choice between 1-7.");
            }
        }
    }

    // Customer Menu Functions 
    private static void viewProfile(Customer customer) {
        System.out.println("\n--- Profile ---");
        System.out.println("Customer ID: " + customer.getCustomerId());
        System.out.println("Name: " + customer.getName());
        System.out.println("Email: " + customer.getEmail());
        System.out.println("Phone: " + customer.getPhoneNumber());
        System.out.println("Branch: " + customer.getBranchLocation());
        System.out.println("Postal Code: " + customer.getPostalCode());
    }

    private static void viewAccountDetails(Customer customer) {
        Accounts account = selectAccount(customer);
        if (account == null) return;

        System.out.println("\n--- Account Details ---");
        System.out.println("Account Type: " + account.getAccountType());
        System.out.println("Account Number: " + account.getAccountNumber());
        System.out.println("Routing Number: " + account.getRoutingNumber());
        System.out.println("Primary Owner: " + account.getPrimaryOwner());
        System.out.println("Balance: $" + account.getBalance());
        System.out.println("Direct Deposit: " + (account.isDirectDeposit() ? "Enabled" : "Disabled"));
        System.out.println("APY: " + account.getAPY());
        account.getJointOwners();
    }

    private static void depositToAccount(Customer customer) {
        Accounts account = selectAccount(customer);
        if (account == null) return;

        double amount = readDouble("Enter deposit amount: ");
        if (amount <= 0) {
            System.out.println("Deposit amount must be greater than 0.");
            return;
        }
        account.deposit(amount);
        System.out.println("Deposit successful. New balance: $" + account.getBalance());
    }

    private static void withdrawFromAccount(Customer customer) {
        Accounts account = selectAccount(customer);
        if (account == null) return;

        double amount = readDouble("Enter withdrawal amount: ");
        if (amount <= 0) {
            System.out.println("Withdrawal amount must be greater than 0.");
            return;
        }
        if (amount > account.getBalance()) {
            System.out.println("Insufficient funds. Current balance: $" + account.getBalance());
            return;
        }
        account.withdraw(amount);
        System.out.println("Withdrawal successful. New balance: $" + account.getBalance());
    }

    private static void viewTransactionHistory(Customer customer) {
        Accounts account = selectAccount(customer);
        if (account == null) return;

        account.getTransactionHistory();
    }

    private static void transferFunds(Customer customer) {
        Accounts fromAccount = selectAccount(customer);
        if (fromAccount == null) return;

        System.out.print("Enter destination account number: ");
        String toAccountNumber = scanner.nextLine().trim();
        double amount = readDouble("Enter amount to transfer: ");
        customer.interAccountTransfer(fromAccount.getAccountNumber(), toAccountNumber, amount, bank);
    }

    /*
     * Lists the customer's accounts and lets them pick one. Returns null
     * (after printing a message) if the customer has none or the pick is invalid.
     */
    private static Accounts selectAccount(Customer customer) {
        List<Accounts> accounts = customer.getAccounts();
        if (accounts.isEmpty()) {
            System.out.println("No accounts found. Please contact an admin to open one.");
            return null;
        }
        if (accounts.size() == 1) {
            return accounts.get(0);
        }

        System.out.println("\n--- Select an Account ---");
        for (int i = 0; i < accounts.size(); i++) {
            Accounts a = accounts.get(i);
            System.out.println((i + 1) + ". " + a.getAccountType() + " | " + a.getAccountNumber() + " | Balance: $" + a.getBalance());
        }
        int choice = readInt("Choose an account: ");
        if (choice < 1 || choice > accounts.size()) {
            System.out.println("Invalid selection.");
            return null;
        }
        return accounts.get(choice - 1);
    }

    // Helper Methods
    private static Customer findCustomer(String customerId) {
        for (Customer c : bank.getCustomers()) {
            if (c.getCustomerId().equals(customerId)) {
                return c;
            }
        }
        return null;
    }

    private static Accounts findAccount(String accountNumber) {
        for (Accounts a : bank.getAccounts()) {
            if (a.getAccountNumber().equals(accountNumber)) {
                return a;
            }
        }
        return null;
    }

    private static int readInt(String prompt) {
        while (true) {
            System.out.print(prompt);
            try {
                return Integer.parseInt(scanner.nextLine().trim());
            } catch (NumberFormatException e) {
                System.out.println("Please enter a valid whole number.");
            }
        }
    }

    private static double readDouble(String prompt) {
        while (true) {
            System.out.print(prompt);
            try {
                return Double.parseDouble(scanner.nextLine().trim());
            } catch (NumberFormatException e) {
                System.out.println("Please enter a valid number.");
            }
        }
    }

    private static boolean readBoolean(String prompt) {
        while (true) {
            System.out.print(prompt);
            String input = scanner.nextLine().trim().toLowerCase();
            if (input.equals("y") || input.equals("yes")) return true;
            if (input.equals("n") || input.equals("no")) return false;
            System.out.println("Please enter y or n.");
        }
    }
}
