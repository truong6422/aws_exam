"""
Management command: seed_certifications
Creates 3 AWS certifications with domains and sample questions.
Idempotent — uses get_or_create throughout.
"""
from django.core.management.base import BaseCommand

from apps.questions.models import Answer, Certification, Question

CERTIFICATIONS = [
    {
        "code": "SAA-C03",
        "name": "Solutions Architect Associate",
        "description": (
            "Validates the ability to design and implement distributed systems on AWS. "
            "Covers resilient, high-performing, secure, and cost-optimised architectures."
        ),
        "time_limit_minutes": 130,
        "total_questions": 65,
        "passing_score": 72,
        "domains": [
            {
                "name": "Design Secure Architectures",
                "weight_percentage": 30,
                "questions": [
                    {
                        "text": (
                            "A company needs to store sensitive customer data in Amazon S3. "
                            "The data must be encrypted at rest using keys managed by the company. "
                            "Which S3 encryption option meets this requirement?"
                        ),
                        "explanation": (
                            "SSE-KMS with a customer-managed key (CMK) gives full control over "
                            "key rotation and access policies. SSE-S3 uses AWS-managed keys. "
                            "SSE-C requires the client to manage and transmit keys on every request."
                        ),
                        "question_type": "single",
                        "answers": [
                            {"text": "SSE-S3 (AES-256 with AWS-managed keys)", "is_correct": False},
                            {"text": "SSE-KMS with a customer-managed CMK", "is_correct": True},
                            {"text": "SSE-C with client-provided keys", "is_correct": False},
                            {"text": "Client-side encryption before upload", "is_correct": False},
                        ],
                    },
                    {
                        "text": (
                            "Which AWS service allows you to evaluate the compliance of your AWS "
                            "resource configurations with desired settings on an ongoing basis?"
                        ),
                        "explanation": (
                            "AWS Config continuously records resource configurations and evaluates "
                            "them against rules. CloudTrail records API calls. Security Hub aggregates "
                            "findings. GuardDuty detects threats."
                        ),
                        "question_type": "single",
                        "answers": [
                            {"text": "AWS CloudTrail", "is_correct": False},
                            {"text": "AWS Config", "is_correct": True},
                            {"text": "AWS Security Hub", "is_correct": False},
                            {"text": "Amazon GuardDuty", "is_correct": False},
                        ],
                    },
                ],
            },
            {
                "name": "Design Resilient Architectures",
                "weight_percentage": 26,
                "questions": [
                    {
                        "text": (
                            "An application requires a messaging solution that guarantees "
                            "each message is processed exactly once and in the exact order it "
                            "was sent. Which AWS service should be used?"
                        ),
                        "explanation": (
                            "SQS FIFO queues guarantee exactly-once processing and strict ordering. "
                            "Standard SQS offers at-least-once delivery with best-effort ordering. "
                            "SNS is pub/sub and does not guarantee ordering."
                        ),
                        "question_type": "single",
                        "answers": [
                            {"text": "Amazon SQS Standard queue", "is_correct": False},
                            {"text": "Amazon SQS FIFO queue", "is_correct": True},
                            {"text": "Amazon SNS", "is_correct": False},
                            {"text": "Amazon Kinesis Data Streams", "is_correct": False},
                        ],
                    },
                    {
                        "text": (
                            "A Solutions Architect wants to ensure an application remains available "
                            "if a single Availability Zone fails. What is the MINIMUM number of "
                            "Availability Zones required?"
                        ),
                        "explanation": (
                            "Two AZs are the minimum for high availability against a single AZ failure. "
                            "One AZ provides no redundancy. Three or more add further resilience "
                            "but are not the minimum requirement."
                        ),
                        "question_type": "single",
                        "answers": [
                            {"text": "1", "is_correct": False},
                            {"text": "2", "is_correct": True},
                            {"text": "3", "is_correct": False},
                            {"text": "4", "is_correct": False},
                        ],
                    },
                ],
            },
            {
                "name": "Design High-Performing Architectures",
                "weight_percentage": 24,
                "questions": [
                    {
                        "text": (
                            "A web application experiences unpredictable traffic spikes. "
                            "Which combination of services provides automatic scaling for both "
                            "compute and database layers? (Select TWO)"
                        ),
                        "explanation": (
                            "EC2 Auto Scaling adjusts compute capacity automatically. "
                            "Amazon Aurora Serverless v2 scales database capacity on demand. "
                            "RDS Multi-AZ provides HA but not auto-scaling. "
                            "Reserved Instances reduce cost but do not scale."
                        ),
                        "question_type": "multiple",
                        "answers": [
                            {"text": "EC2 Auto Scaling group", "is_correct": True},
                            {"text": "Amazon Aurora Serverless v2", "is_correct": True},
                            {"text": "RDS Multi-AZ deployment", "is_correct": False},
                            {"text": "EC2 Reserved Instances", "is_correct": False},
                        ],
                    },
                    {
                        "text": (
                            "Which AWS service provides a fully managed in-memory cache to "
                            "reduce read latency for a relational database?"
                        ),
                        "explanation": (
                            "Amazon ElastiCache (Redis or Memcached) is the managed in-memory "
                            "caching service. DynamoDB Accelerator (DAX) caches DynamoDB, not "
                            "relational databases. CloudFront caches HTTP content at the edge."
                        ),
                        "question_type": "single",
                        "answers": [
                            {"text": "Amazon CloudFront", "is_correct": False},
                            {"text": "Amazon ElastiCache", "is_correct": True},
                            {"text": "Amazon DynamoDB Accelerator (DAX)", "is_correct": False},
                            {"text": "AWS Global Accelerator", "is_correct": False},
                        ],
                    },
                ],
            },
            {
                "name": "Design Cost-Optimized Architectures",
                "weight_percentage": 20,
                "questions": [
                    {
                        "text": (
                            "A company runs a batch processing job every night for 4 hours. "
                            "The job can be interrupted and restarted. Which EC2 purchasing option "
                            "provides the lowest cost?"
                        ),
                        "explanation": (
                            "Spot Instances offer up to 90% discount vs On-Demand and are ideal "
                            "for fault-tolerant, interruptible workloads. On-Demand is full price. "
                            "Reserved Instances require 1- or 3-year commitments."
                        ),
                        "question_type": "single",
                        "answers": [
                            {"text": "On-Demand Instances", "is_correct": False},
                            {"text": "Spot Instances", "is_correct": True},
                            {"text": "Reserved Instances (1-year)", "is_correct": False},
                            {"text": "Dedicated Hosts", "is_correct": False},
                        ],
                    },
                    {
                        "text": (
                            "Which S3 storage class is the MOST cost-effective for data that is "
                            "accessed infrequently but must be retrieved within milliseconds?"
                        ),
                        "explanation": (
                            "S3 Standard-IA (Infrequent Access) provides millisecond retrieval "
                            "at a lower storage cost than S3 Standard. S3 Glacier is cheaper "
                            "but has retrieval times of minutes to hours."
                        ),
                        "question_type": "single",
                        "answers": [
                            {"text": "S3 Standard", "is_correct": False},
                            {"text": "S3 Standard-IA", "is_correct": True},
                            {"text": "S3 Glacier Flexible Retrieval", "is_correct": False},
                            {"text": "S3 One Zone-IA", "is_correct": False},
                        ],
                    },
                ],
            },
        ],
    },
    {
        "code": "CLF-C02",
        "name": "Cloud Practitioner",
        "description": (
            "Foundational AWS certification covering cloud concepts, core services, "
            "security, architecture, pricing, and support."
        ),
        "time_limit_minutes": 90,
        "total_questions": 65,
        "passing_score": 70,
        "domains": [
            {
                "name": "Cloud Concepts",
                "weight_percentage": 24,
                "questions": [
                    {
                        "text": (
                            "Which cloud deployment model runs infrastructure entirely on-premises "
                            "using cloud-like technologies managed by the customer?"
                        ),
                        "explanation": (
                            "A private cloud is hosted on-premises and managed by the organisation. "
                            "A public cloud is hosted by a cloud provider. A hybrid cloud combines "
                            "on-premises and public cloud."
                        ),
                        "question_type": "single",
                        "answers": [
                            {"text": "Public cloud", "is_correct": False},
                            {"text": "Private cloud", "is_correct": True},
                            {"text": "Hybrid cloud", "is_correct": False},
                            {"text": "Community cloud", "is_correct": False},
                        ],
                    },
                    {
                        "text": (
                            "Which of the following is a benefit of cloud computing that allows "
                            "customers to avoid large upfront capital expenditure on data centres?"
                        ),
                        "explanation": (
                            "Cloud computing converts capital expenditure (CapEx) to operational "
                            "expenditure (OpEx), paying only for what is consumed."
                        ),
                        "question_type": "single",
                        "answers": [
                            {"text": "High availability", "is_correct": False},
                            {"text": "Trade capital expense for operational expense", "is_correct": True},
                            {"text": "Economies of scale", "is_correct": False},
                            {"text": "Global reach", "is_correct": False},
                        ],
                    },
                ],
            },
            {
                "name": "Security and Compliance",
                "weight_percentage": 30,
                "questions": [
                    {
                        "text": (
                            "Under the AWS Shared Responsibility Model, which of the following "
                            "is the customer's responsibility?"
                        ),
                        "explanation": (
                            "Customers are responsible for security IN the cloud: OS patching, "
                            "application security, IAM configuration, and data encryption. "
                            "AWS is responsible for security OF the cloud: hardware, facilities, "
                            "network infrastructure."
                        ),
                        "question_type": "single",
                        "answers": [
                            {"text": "Physical security of data centres", "is_correct": False},
                            {"text": "Hypervisor patching", "is_correct": False},
                            {"text": "IAM user permissions and policies", "is_correct": True},
                            {"text": "Network infrastructure maintenance", "is_correct": False},
                        ],
                    },
                    {
                        "text": (
                            "Which AWS service provides a single place to manage security alerts "
                            "and automate security checks across AWS accounts?"
                        ),
                        "explanation": (
                            "AWS Security Hub aggregates findings from services like GuardDuty, "
                            "Inspector, and Macie into a single dashboard with automated compliance "
                            "checks against standards like CIS AWS Foundations."
                        ),
                        "question_type": "single",
                        "answers": [
                            {"text": "Amazon GuardDuty", "is_correct": False},
                            {"text": "AWS Security Hub", "is_correct": True},
                            {"text": "AWS Shield", "is_correct": False},
                            {"text": "Amazon Inspector", "is_correct": False},
                        ],
                    },
                ],
            },
            {
                "name": "Cloud Technology and Services",
                "weight_percentage": 34,
                "questions": [
                    {
                        "text": (
                            "Which AWS compute service allows you to run code without provisioning "
                            "or managing servers, charging only for the compute time consumed?"
                        ),
                        "explanation": (
                            "AWS Lambda is a serverless compute service. You upload code, define "
                            "triggers, and Lambda handles all infrastructure. You pay per invocation "
                            "and duration."
                        ),
                        "question_type": "single",
                        "answers": [
                            {"text": "Amazon EC2", "is_correct": False},
                            {"text": "AWS Lambda", "is_correct": True},
                            {"text": "Amazon ECS", "is_correct": False},
                            {"text": "AWS Elastic Beanstalk", "is_correct": False},
                        ],
                    },
                    {
                        "text": (
                            "Which AWS service is a globally distributed content delivery network "
                            "that caches content at edge locations close to end users?"
                        ),
                        "explanation": (
                            "Amazon CloudFront is the AWS CDN. It caches static and dynamic content "
                            "at 400+ Points of Presence globally, reducing latency. "
                            "Route 53 is DNS. Global Accelerator optimises TCP/UDP routing."
                        ),
                        "question_type": "single",
                        "answers": [
                            {"text": "Amazon Route 53", "is_correct": False},
                            {"text": "AWS Global Accelerator", "is_correct": False},
                            {"text": "Amazon CloudFront", "is_correct": True},
                            {"text": "Amazon API Gateway", "is_correct": False},
                        ],
                    },
                ],
            },
            {
                "name": "Billing, Pricing and Support",
                "weight_percentage": 12,
                "questions": [
                    {
                        "text": (
                            "Which AWS tool provides a personalised view of service health events "
                            "and planned changes that may affect your AWS resources?"
                        ),
                        "explanation": (
                            "AWS Health Dashboard (formerly Personal Health Dashboard) provides "
                            "alerts specific to your account's resources. The Service Health Dashboard "
                            "shows general AWS service status."
                        ),
                        "question_type": "single",
                        "answers": [
                            {"text": "AWS Service Health Dashboard", "is_correct": False},
                            {"text": "AWS Health Dashboard", "is_correct": True},
                            {"text": "AWS Trusted Advisor", "is_correct": False},
                            {"text": "Amazon CloudWatch", "is_correct": False},
                        ],
                    },
                    {
                        "text": (
                            "Which AWS pricing model provides up to 72% discount compared to "
                            "On-Demand in exchange for a 1- or 3-year commitment to a consistent "
                            "usage amount?"
                        ),
                        "explanation": (
                            "Compute Savings Plans and EC2 Instance Savings Plans offer up to 72% "
                            "discount for committed usage. Reserved Instances provide similar savings "
                            "with more restrictions. Spot Instances are cheaper but interruptible."
                        ),
                        "question_type": "single",
                        "answers": [
                            {"text": "Spot Instances", "is_correct": False},
                            {"text": "Dedicated Hosts", "is_correct": False},
                            {"text": "Savings Plans", "is_correct": True},
                            {"text": "On-Demand Capacity Reservations", "is_correct": False},
                        ],
                    },
                ],
            },
        ],
    },
    {
        "code": "DVA-C02",
        "name": "Developer Associate",
        "description": (
            "Validates expertise in developing, deploying, and debugging cloud-based "
            "applications using AWS services and best practices."
        ),
        "time_limit_minutes": 130,
        "total_questions": 65,
        "passing_score": 72,
        "domains": [
            {
                "name": "Development with AWS Services",
                "weight_percentage": 32,
                "questions": [
                    {
                        "text": (
                            "A developer needs to store application configuration values such as "
                            "database passwords securely and retrieve them at runtime without "
                            "hardcoding them. Which AWS service is BEST suited?"
                        ),
                        "explanation": (
                            "AWS Secrets Manager stores, rotates, and retrieves secrets like "
                            "database credentials and API keys. SSM Parameter Store can also store "
                            "secrets but lacks automatic rotation. Environment variables risk "
                            "accidental exposure."
                        ),
                        "question_type": "single",
                        "answers": [
                            {"text": "AWS Systems Manager Parameter Store (Standard)", "is_correct": False},
                            {"text": "AWS Secrets Manager", "is_correct": True},
                            {"text": "Amazon S3 with bucket policy", "is_correct": False},
                            {"text": "Lambda environment variables", "is_correct": False},
                        ],
                    },
                    {
                        "text": (
                            "Which AWS SDK credential provider chain order is correct when "
                            "running code on an Amazon EC2 instance?"
                        ),
                        "explanation": (
                            "The SDK checks: 1) Code/explicit credentials, 2) Environment variables, "
                            "3) AWS credentials file, 4) Instance profile/IAM role. Using IAM roles "
                            "attached to EC2 is the recommended approach — no keys stored on disk."
                        ),
                        "question_type": "single",
                        "answers": [
                            {"text": "Environment variables → credentials file → instance profile", "is_correct": True},
                            {"text": "Instance profile → credentials file → environment variables", "is_correct": False},
                            {"text": "Credentials file → environment variables → instance profile", "is_correct": False},
                            {"text": "Instance profile → environment variables → credentials file", "is_correct": False},
                        ],
                    },
                ],
            },
            {
                "name": "Security",
                "weight_percentage": 26,
                "questions": [
                    {
                        "text": (
                            "A Lambda function needs read access to an S3 bucket. "
                            "What is the MOST secure way to grant this access?"
                        ),
                        "explanation": (
                            "Attach an IAM execution role to the Lambda function with a policy "
                            "granting s3:GetObject on the specific bucket. Never embed access keys "
                            "in code or environment variables — they can be exposed in logs or repos."
                        ),
                        "question_type": "single",
                        "answers": [
                            {"text": "Embed IAM access keys in the Lambda function code", "is_correct": False},
                            {"text": "Store access keys in Lambda environment variables", "is_correct": False},
                            {"text": "Attach an IAM execution role with an S3 read policy", "is_correct": True},
                            {"text": "Make the S3 bucket public", "is_correct": False},
                        ],
                    },
                    {
                        "text": (
                            "Which Amazon Cognito feature enables users to sign in using their "
                            "existing social identity providers such as Google or Facebook?"
                        ),
                        "explanation": (
                            "Cognito User Pools support federation with social IdPs (Google, Facebook, "
                            "Apple) and SAML/OIDC providers. Identity Pools provide temporary AWS "
                            "credentials for authenticated users."
                        ),
                        "question_type": "single",
                        "answers": [
                            {"text": "Cognito Identity Pools", "is_correct": False},
                            {"text": "Cognito User Pools with federated identities", "is_correct": True},
                            {"text": "AWS IAM Identity Center", "is_correct": False},
                            {"text": "AWS Directory Service", "is_correct": False},
                        ],
                    },
                ],
            },
            {
                "name": "Deployment",
                "weight_percentage": 24,
                "questions": [
                    {
                        "text": (
                            "A developer wants to deploy a new version of a Lambda function and "
                            "gradually shift 10% of traffic to it while keeping 90% on the current "
                            "version. Which feature enables this?"
                        ),
                        "explanation": (
                            "Lambda Aliases with weighted routing allow traffic splitting between "
                            "function versions. Combined with CodeDeploy, this enables canary or "
                            "linear deployment strategies without downtime."
                        ),
                        "question_type": "single",
                        "answers": [
                            {"text": "Lambda layers", "is_correct": False},
                            {"text": "Lambda aliases with weighted routing", "is_correct": True},
                            {"text": "Lambda provisioned concurrency", "is_correct": False},
                            {"text": "Lambda reserved concurrency", "is_correct": False},
                        ],
                    },
                    {
                        "text": (
                            "Which AWS CodeDeploy deployment type launches the new application "
                            "version alongside the old one and then shifts traffic, minimising "
                            "downtime?"
                        ),
                        "explanation": (
                            "Blue/green deployment provisions a new environment (green), deploys "
                            "the new version, then shifts traffic from old (blue) to new. "
                            "In-place deployment updates existing instances with potential downtime."
                        ),
                        "question_type": "single",
                        "answers": [
                            {"text": "In-place deployment", "is_correct": False},
                            {"text": "Blue/green deployment", "is_correct": True},
                            {"text": "Rolling deployment", "is_correct": False},
                            {"text": "Immutable deployment", "is_correct": False},
                        ],
                    },
                ],
            },
            {
                "name": "Troubleshooting and Optimization",
                "weight_percentage": 18,
                "questions": [
                    {
                        "text": (
                            "A Lambda function is timing out intermittently. "
                            "Which AWS service provides detailed traces to identify slow downstream "
                            "calls to DynamoDB and other services?"
                        ),
                        "explanation": (
                            "AWS X-Ray provides distributed tracing, service maps, and latency "
                            "analysis for Lambda functions and other AWS services. CloudWatch Logs "
                            "captures log output but not traces. CloudTrail records API calls."
                        ),
                        "question_type": "single",
                        "answers": [
                            {"text": "Amazon CloudWatch Logs Insights", "is_correct": False},
                            {"text": "AWS X-Ray", "is_correct": True},
                            {"text": "AWS CloudTrail", "is_correct": False},
                            {"text": "Amazon EventBridge", "is_correct": False},
                        ],
                    },
                    {
                        "text": (
                            "A DynamoDB table has a hot partition due to all writes targeting "
                            "the same partition key. Which strategy best resolves this?"
                        ),
                        "explanation": (
                            "Adding a random suffix or timestamp to the partition key distributes "
                            "writes across multiple partitions (write sharding). DynamoDB Accelerator "
                            "(DAX) improves read performance, not write distribution."
                        ),
                        "question_type": "single",
                        "answers": [
                            {"text": "Enable DynamoDB Streams", "is_correct": False},
                            {"text": "Use DynamoDB Accelerator (DAX)", "is_correct": False},
                            {"text": "Add a random suffix to the partition key (write sharding)", "is_correct": True},
                            {"text": "Increase the read capacity units", "is_correct": False},
                        ],
                    },
                ],
            },
        ],
    },
]


class Command(BaseCommand):
    help = "Seed certifications, domains, and sample questions (idempotent)."

    def handle(self, *args, **options):
        total_certs = 0
        total_questions = 0
        total_answers = 0

        for cert_data in CERTIFICATIONS:
            # We don't want to mutate the global list, but we need to pop domains
            data = cert_data.copy()
            domains_data = data.pop("domains")
            cert, created = Certification.objects.get_or_create(
                code=data["code"],
                defaults=data,
            )
            if created:
                total_certs += 1
                self.stdout.write(f"  Created certification: {cert}")
            else:
                self.stdout.write(f"  Exists: {cert}")

            for domain_data in domains_data:
                questions_data = domain_data.get("questions", [])
                for q_data in questions_data:
                    # Copy to avoid mutation
                    question_data = q_data.copy()
                    answers_data = question_data.pop("answers")
                    question, q_created = Question.objects.get_or_create(
                        certification=cert,
                        text=question_data["text"],
                        defaults=question_data,
                    )
                    if q_created:
                        total_questions += 1
                        for ans_data in answers_data:
                            Answer.objects.get_or_create(
                                question=question,
                                text=ans_data["text"],
                                defaults={"is_correct": ans_data["is_correct"]},
                            )
                            total_answers += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone — created {total_certs} certifications, "
                f"{total_questions} questions, {total_answers} answers."
            )
        )
