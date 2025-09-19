;; metaverse-rental-manager
;; Smart contract for decentralized-virtual-real-estate

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u100))
(define-constant ERR_INVALID_PARAMS (err u101))
(define-constant ERR_NOT_FOUND (err u102))

;; Data Variables
(define-data-var contract-active bool true)
(define-data-var total-operations uint u0)

;; Data Maps
(define-map authorized-users principal bool)
(define-map operation-log uint {
    operator: principal,
    action: (string-ascii 64),
    timestamp: uint
})

;; Private Functions
(define-private (is-authorized (user principal))
    (or 
        (is-eq user CONTRACT_OWNER)
        (default-to false (map-get? authorized-users user))
    )
)

(define-private (log-operation (action (string-ascii 64)))
    (let ((operation-id (var-get total-operations)))
        (map-set operation-log operation-id {
            operator: tx-sender,
            action: action,
            timestamp: block-height
        })
        (var-set total-operations (+ operation-id u1))
        operation-id
    )
)

;; Public Functions
(define-public (initialize)
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
        (var-set contract-active true)
        (log-operation "initialize")
        (ok true)
    )
)

(define-public (authorize-user (user principal))
    (begin
        (asserts! (is-authorized tx-sender) ERR_UNAUTHORIZED)
        (asserts! (not (is-eq user CONTRACT_OWNER)) ERR_INVALID_PARAMS)
        (map-set authorized-users user true)
        (log-operation "authorize-user")
        (ok true)
    )
)

(define-public (deauthorize-user (user principal))
    (begin
        (asserts! (is-authorized tx-sender) ERR_UNAUTHORIZED)
        (asserts! (not (is-eq user CONTRACT_OWNER)) ERR_INVALID_PARAMS)
        (map-set authorized-users user false)
        (log-operation "deauthorize-user")
        (ok true)
    )
)

(define-public (toggle-contract)
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
        (var-set contract-active (not (var-get contract-active)))
        (log-operation "toggle-contract")
        (ok (var-get contract-active))
    )
)

(define-public (emergency-pause)
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
        (var-set contract-active false)
        (log-operation "emergency-pause")
        (ok true)
    )
)

;; Read-only Functions
(define-read-only (get-contract-status)
    (var-get contract-active)
)

(define-read-only (is-user-authorized (user principal))
    (is-authorized user)
)

(define-read-only (get-total-operations)
    (var-get total-operations)
)

(define-read-only (get-operation-log (operation-id uint))
    (map-get? operation-log operation-id)
)

(define-read-only (get-contract-owner)
    CONTRACT_OWNER
)

;; Enhanced Features
(define-data-var contract-version (string-ascii 16) "v1.0.0")
(define-data-var maintenance-mode bool false)

;; Enhanced Maps
(define-map user-profiles principal {
    created-at: uint,
    last-activity: uint,
    reputation-score: uint
})

(define-map feature-flags (string-ascii 32) bool)

;; Enhanced Functions
(define-public (set-maintenance-mode (enabled bool))
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
        (var-set maintenance-mode enabled)
        (log-operation (if enabled "maintenance-on" "maintenance-off"))
        (ok enabled)
    )
)

(define-public (create-user-profile)
    (let ((user tx-sender))
        (asserts! (not (var-get maintenance-mode)) ERR_INVALID_PARAMS)
        (asserts! (is-none (map-get? user-profiles user)) ERR_INVALID_PARAMS)
        (map-set user-profiles user {
            created-at: block-height,
            last-activity: block-height,
            reputation-score: u0
        })
        (log-operation "profile-created")
        (ok true)
    )
)

(define-public (update-user-activity)
    (let ((user tx-sender))
        (asserts! (not (var-get maintenance-mode)) ERR_INVALID_PARAMS)
        (match (map-get? user-profiles user)
            profile (begin
                (map-set user-profiles user (merge profile { last-activity: block-height }))
                (log-operation "activity-updated")
                (ok true)
            )
            ERR_NOT_FOUND
        )
    )
)

(define-public (set-feature-flag (flag (string-ascii 32)) (enabled bool))
    (begin
        (asserts! (is-authorized tx-sender) ERR_UNAUTHORIZED)
        (map-set feature-flags flag enabled)
        (log-operation "feature-flag-set")
        (ok true)
    )
)

;; Enhanced Read-only Functions
(define-read-only (get-contract-version)
    (var-get contract-version)
)

(define-read-only (is-maintenance-mode)
    (var-get maintenance-mode)
)

(define-read-only (get-user-profile (user principal))
    (map-get? user-profiles user)
)

(define-read-only (get-feature-flag (flag (string-ascii 32)))
    (default-to false (map-get? feature-flags flag))
)

(define-read-only (get-user-reputation (user principal))
    (match (map-get? user-profiles user)
        profile (get reputation-score profile)
        u0
    )
)

;; Analytics and Monitoring
(define-data-var daily-active-users uint u0)
(define-data-var last-reset-block uint u0)

(define-map daily-stats uint {
    active-users: uint,
    total-operations: uint,
    block-height: uint
})

(define-map user-activity-streak principal uint)

;; Monitoring Functions
(define-private (update-daily-stats)
    (let ((current-block block-height)
          (last-reset (var-get last-reset-block))
          (blocks-per-day u144)) ;; Approximately 144 blocks per day on Stacks
        (if (>= (- current-block last-reset) blocks-per-day)
            (begin
                (map-set daily-stats last-reset {
                    active-users: (var-get daily-active-users),
                    total-operations: (var-get total-operations),
                    block-height: last-reset
                })
                (var-set daily-active-users u0)
                (var-set last-reset-block current-block)
                true
            )
            false
        )
    )
)

(define-private (increment-user-streak (user principal))
    (let ((current-streak (default-to u0 (map-get? user-activity-streak user))))
        (map-set user-activity-streak user (+ current-streak u1))
        true
    )
)

(define-public (record-user-activity (user principal))
    (begin
        (asserts! (is-authorized tx-sender) ERR_UNAUTHORIZED)
        (update-daily-stats)
        (increment-user-streak user)
        (var-set daily-active-users (+ (var-get daily-active-users) u1))
        (log-operation "user-activity-recorded")
        (ok true)
    )
)

(define-public (reset-daily-stats)
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
        (update-daily-stats)
        (log-operation "daily-stats-reset")
        (ok true)
    )
)

;; Analytics Read-only Functions
(define-read-only (get-daily-active-users)
    (var-get daily-active-users)
)

(define-read-only (get-daily-stats (day uint))
    (map-get? daily-stats day)
)

(define-read-only (get-user-activity-streak (user principal))
    (default-to u0 (map-get? user-activity-streak user))
)

(define-read-only (get-analytics-summary)
    {
        daily-active-users: (var-get daily-active-users),
        total-operations: (var-get total-operations),
        contract-version: (var-get contract-version),
        maintenance-mode: (var-get maintenance-mode),
        current-block: block-height
    }
)
