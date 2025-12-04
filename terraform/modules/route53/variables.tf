variable "hosted_zone_name" {
  description = "Name of the Route53 hosted zone (e.g., yerson.co)"
  type        = string
  default     = ""
}

variable "frontend_subdomain" {
  description = "Subdomain for frontend (e.g., app.yerson.co)"
  type        = string
  default     = ""
}

variable "api_subdomain" {
  description = "Subdomain for API (e.g., storyarchitect.yerson.co)"
  type        = string
  default     = ""
}

variable "cloudfront_domain_name" {
  description = "Domain name of CloudFront distribution"
  type        = string
}

variable "cloudfront_hosted_zone_id" {
  description = "Hosted zone ID of CloudFront distribution"
  type        = string
}

variable "api_gateway_domain_target" {
  description = "Target domain name for API Gateway"
  type        = string
  default     = ""
}

variable "api_gateway_hosted_zone_id" {
  description = "Hosted zone ID for API Gateway regional endpoint"
  type        = string
  default     = ""
}
