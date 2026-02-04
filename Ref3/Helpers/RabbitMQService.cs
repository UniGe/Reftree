using System;
using System.Text;
using System.Configuration;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using RabbitMQ.Client.Exceptions;
using Newtonsoft.Json;
using MagicFramework.Helpers;

namespace Ref3.Helpers
{
    public class RabbitMQService
    {
        private readonly bool _isActive;
        private readonly string _host;
        private readonly int _port;
        private readonly string _username;
        private readonly string _password;
        private readonly string _virtualHost;
        private readonly int _connectionTimeout;
        private readonly bool _autoRecovery;

        public RabbitMQService()
        {
            var config = ApplicationSettingsManager.GetRabbitMQConfig();
            if (config == null) {
                _isActive = false;
                return;
            }
            _isActive = config.isActive;
            _host = config.Host ?? "localhost";
            _port = config.Port;
            _username = config.Username ?? "guest";
            _password = config.Password ?? "guest";
            _virtualHost = "/";
            _connectionTimeout = 30;
            _autoRecovery = true;
        }

        public RabbitMQService(bool isActive, string host, int port, string username, string password, string virtualHost, int connectionTimeout = 30, bool autoRecovery = true)
        {
            _isActive = isActive;
            _host = host;
            _port = port;
            _username = username;
            _password = password;
            _virtualHost = virtualHost;
            _connectionTimeout = connectionTimeout;
            _autoRecovery = autoRecovery;
        }

        /// <summary>
        /// Sends a message to RabbitMQ and throws an exception if connection fails
        /// </summary>
        /// <typeparam name="T">Type of message to send</typeparam>
        /// <param name="message">The message object</param>
        /// <param name="queueName">Queue to send to</param>
        /// <param name="exchangeName">Exchange to use</param>
        /// <returns>True if message was sent successfully</returns>
        public bool SendMessage<T>(T message, string queueName = "file_zip_queue", string exchangeName = "amq.direct")
        {
            // Log connection attempt
            MFLog.LogInFile($"Attempting to connect to RabbitMQ: Host={_host}, Port={_port}, VHost={_virtualHost}, User={_username}", MFLog.logtypes.INFO);

            // Configure connection factory
            var factory = new ConnectionFactory
            {
                HostName = _host,
                Port = _port,
                UserName = _username,
                Password = _password,
                VirtualHost = _virtualHost,
                RequestedConnectionTimeout = TimeSpan.FromSeconds(_connectionTimeout),
                AutomaticRecoveryEnabled = _autoRecovery
            };

            try
            {
                using (var connection = factory.CreateConnection())
                {
                    MFLog.LogInFile("Successfully connected to RabbitMQ", MFLog.logtypes.INFO);

                    using (var channel = connection.CreateModel())
                    {
                        // Declare the queue
                        channel.QueueDeclare(
                            queue: queueName,
                            durable: true,
                            exclusive: false,
                            autoDelete: false,
                            arguments: null
                        );

                        // Bind queue to exchange
                        channel.QueueBind(
                            queue: queueName,
                            exchange: exchangeName,
                            routingKey: queueName
                        );

                        // Serialize the message
                        string jsonMessage = JsonConvert.SerializeObject(message);
                        var body = Encoding.UTF8.GetBytes(jsonMessage);

                        // Configure message properties
                        var properties = channel.CreateBasicProperties();
                        properties.Persistent = true;
                        properties.ContentType = "application/json";
                        properties.MessageId = Guid.NewGuid().ToString();

                        // Extract correlation ID and app ID if message is a ZipMessage
                        if (message is Ref3.BL.FileGenerator.ZipMessage zipMessage)
                        {
                            properties.CorrelationId = zipMessage.job_id;
                            properties.AppId = zipMessage.application_name;
                        }

                        // Publish the message
                        channel.BasicPublish(
                            exchange: exchangeName,
                            routingKey: queueName,
                            mandatory: true,
                            basicProperties: properties,
                            body: body
                        );

                        if (message is Ref3.BL.FileGenerator.ZipMessage zipMsg)
                        {
                            MFLog.LogInFile($"Sent zip request to RabbitMQ for {zipMsg.files.Count} files. Destination: {zipMsg.destination}, JobId: {zipMsg.job_id}, AppInstance: {zipMsg.application_name}, MessageId: {properties.MessageId}", MFLog.logtypes.INFO);
                        }
                        else
                        {
                            MFLog.LogInFile($"Sent message to RabbitMQ queue '{queueName}', MessageId: {properties.MessageId}", MFLog.logtypes.INFO);
                        }

                        return true;
                    }
                }
            }
            catch (BrokerUnreachableException ex)
            {
                MFLog.LogInFile($"RabbitMQ broker unreachable: {ex.Message}, Stack trace: {ex.StackTrace}", MFLog.logtypes.ERROR);
                throw; // Rethrow to allow caller to handle the connection failure
            }
            catch (Exception ex)
            {
                MFLog.LogInFile($"Failed to send message to RabbitMQ: {ex.Message}, Stack trace: {ex.StackTrace}", MFLog.logtypes.ERROR);
                throw; // Rethrow to allow caller to handle the error
            }
        }
        /// <summary>
        /// Deletes a specific job from the RabbitMQ queue based on userId and dossierId
        /// Uses a temporary holding queue to preserve message order
        /// </summary>
        /// <param name="userId">User ID associated with the job</param>
        /// <param name="dossierId">Dossier ID associated with the job</param>
        /// <param name="queueName">Queue name to search in</param>
        /// <returns>The jobId of the deleted message if found, null otherwise</returns>
        public string DeleteJobFromQueue(int userId, int referenceId, string referenceType = "dossier", string queueName = "file_zip_queue")
        {
            MFLog.LogInFile($"Attempting to delete job from queue for UserId={userId}, ReferenceType={referenceType}, ReferenceId={referenceId}", MFLog.logtypes.INFO);

            // Configure connection factory
            var factory = new ConnectionFactory
            {
                HostName = _host,
                Port = _port,
                UserName = _username,
                Password = _password,
                VirtualHost = _virtualHost,
                RequestedConnectionTimeout = TimeSpan.FromSeconds(_connectionTimeout),
                AutomaticRecoveryEnabled = _autoRecovery
            };

            string foundJobId = null;

            try
            {
                using (var connection = factory.CreateConnection())
                using (var channel = connection.CreateModel())
                {
                    // Create a temporary holding queue with a unique name
                    string tempQueueName = $"temp_holding_queue_{Guid.NewGuid()}";
                    channel.QueueDeclare(
                        queue: tempQueueName,
                        durable: false,
                        exclusive: true,
                        autoDelete: true,
                        arguments: null
                    );

                    // Set the prefetch count to 1 to process one message at a time
                    channel.BasicQos(0, 1, false);

                    // Process the source queue
                    uint messageCount = 0;

                    // Get the number of messages in the queue
                    var queueDeclareOk = channel.QueueDeclare(
                        queue: queueName,
                        durable: true,
                        exclusive: false,
                        autoDelete: false,
                        arguments: null);

                    int remainingMessages = (int)queueDeclareOk.MessageCount;
                    MFLog.LogInFile($"Queue {queueName} has {remainingMessages} messages", MFLog.logtypes.INFO);

                    // Process each message in the queue
                    while (remainingMessages > 0)
                    {
                        // Get a message from the original queue (with autoAck = false)
                        var result = channel.BasicGet(queueName, false);

                        if (result == null)
                        {
                            // No more messages in the queue
                            break;
                        }

                        remainingMessages--;
                        messageCount++;

                        // Process the message
                        var body = result.Body.ToArray();
                        var messageString = Encoding.UTF8.GetString(body);

                        try
                        {
                            // Deserialize the message
                            var message = JsonConvert.DeserializeObject<BL.FileGenerator.ZipMessage>(messageString);

                            // Check if this is our target message - handles both old and new formats
                            bool isTargetMessage = false;

                            if (message != null && message.user_id == userId)
                            {
                                // Check if it matches our reference criteria
                                if (message.reference_type == referenceType && message.reference_id == referenceId)
                                {
                                    // New format with specified reference type
                                    isTargetMessage = true;
                                }
                            }

                            if (isTargetMessage)
                            {
                                // This is our target - acknowledge it (effectively deleting it)
                                foundJobId = message.job_id;
                                MFLog.LogInFile($"Found matching job in queue: JobId={foundJobId}, UserId={message.user_id}, ReferenceType={referenceType}, ReferenceId={referenceId}", MFLog.logtypes.INFO);
                                channel.BasicAck(result.DeliveryTag, false);
                            }
                            else
                            {
                                // Not our target - move to temporary queue to preserve order
                                var properties = result.BasicProperties;
                                channel.BasicPublish(
                                    exchange: "",
                                    routingKey: tempQueueName,
                                    basicProperties: properties,
                                    body: body
                                );

                                // Acknowledge the message from the original queue
                                channel.BasicAck(result.DeliveryTag, false);
                            }
                        }
                        catch (Exception ex)
                        {
                            // Error processing the message - move it to temp queue to be safe
                            MFLog.LogInFile($"Error processing message: {ex.Message}", MFLog.logtypes.ERROR);
                            var properties = result.BasicProperties;
                            channel.BasicPublish(
                                exchange: "",
                                routingKey: tempQueueName,
                                basicProperties: properties,
                                body: body
                            );

                            // Acknowledge the message from the original queue
                            channel.BasicAck(result.DeliveryTag, false);
                        }
                    }

                    MFLog.LogInFile($"Processed {messageCount} messages, found match: {foundJobId != null}", MFLog.logtypes.INFO);

                    // Move all messages back from the temporary queue to the original queue
                    uint messagesReturned = 0;

                    while (true)
                    {
                        var result = channel.BasicGet(tempQueueName, false);
                        if (result == null)
                            break;

                        var body = result.Body.ToArray();
                        var properties = result.BasicProperties;

                        // Republish to the original queue
                        channel.BasicPublish(
                            exchange: "",
                            routingKey: queueName,
                            basicProperties: properties,
                            body: body
                        );

                        // Acknowledge from temp queue
                        channel.BasicAck(result.DeliveryTag, false);
                        messagesReturned++;
                    }

                    MFLog.LogInFile($"Returned {messagesReturned} messages to the original queue", MFLog.logtypes.INFO);

                    // The temporary queue will be deleted automatically when the channel is closed
                }
            }
            catch (Exception ex)
            {
                MFLog.LogInFile($"Error while trying to delete job from queue: {ex.Message}", MFLog.logtypes.ERROR);
                return null;
            }

            return foundJobId; // Will be null if no matching message was found
        }

        /// <summary>
        /// Checks if RabbitMQ connection can be established
        /// </summary>
        /// <returns>True if connection succeeds, false otherwise</returns>
        public bool IsConnectionAvailable()
        {
            var factory = new ConnectionFactory
            {
                HostName = _host,
                Port = _port,
                UserName = _username,
                Password = _password,
                VirtualHost = _virtualHost,
                RequestedConnectionTimeout = TimeSpan.FromSeconds(5), // Short timeout for connection check
                AutomaticRecoveryEnabled = false // No need for recovery in a test
            };

            try
            {
                using (var connection = factory.CreateConnection())
                {
                    return connection.IsOpen;
                }
            }
            catch (Exception ex)
            {
                MFLog.LogInFile($"RabbitMQ connection test failed: {ex.Message}", MFLog.logtypes.WARN);
                return false;
            }
        }

        public bool isActive() {
            return _isActive;
        }
    }
}