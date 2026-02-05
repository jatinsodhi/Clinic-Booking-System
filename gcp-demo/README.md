# GCP Workflows & Microservices Demo

This folder contains a proof-of-concept demo showcasing how **GCP Workflows** can orchestrate distributed **Microservices** using the **Saga Pattern**.

## Structure

*   `services.js`: A mock "Mockroservices" server (running on port 8080) that simulates:
    *   **Inventory Service**: Reserves items.
    *   **Payment Service**: Processes payments.
    *   **Notification Service**: Sends emails.
    *   **Booking Service**: Confirms orders.
*   `workflow.yaml`: The **GCP Workflows** definition file. This is the code you would deploy to Google Cloud to orchestrate the services.
*   `client.js`: A local simulator (node script) that acts as the Workflow Engine, executing the logic defined in `workflow.yaml` against the local `services.js`.

## How to Run the Demo

### 1. Start the Microservices Server
Open a terminal in this folder (`gcp-demo`) and run:
```bash
node services.js
```
You should see: `Microservices Mock Server running on port 8080`.

### 2. Run the Workflow Simulator
Open **another** terminal, navigate to `gcp-demo`, and run:
```bash
node client.js
```

### 3. Interact
Select a scenario from the menu:
*   **Happy Path**: All services succeed.
*   **Inventory Fail**: Inventory denies reservation (Instant fail).
*   **Payment Fail**: Inventory succeeds, but Payment fails. Watch how the **Compensation** step is triggered to release the inventory automatically.

## The Saga Pattern
This demo illustrates the **Saga Pattern** for distributed transactions:

1.  **Reserve Inventory** (Transaction A)
2.  **Process Payment** (Transaction B) - *If this fails...*
3.  **Compensate Inventory** (Undo Transaction A)

This ensures data consistency across microservices without distributed locking.
