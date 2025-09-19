;; virtual-land-registry
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
