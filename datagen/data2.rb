require 'date'
require 'tempfile'
require 'csv'

headers = ['date', 'gender', 'age', 'steps_amount', 'sleep_amount', 'food_amount', 'amount_possible']
rows = []
users = []
num_users = 1000
incentives = [
  { name: 'steps', label: 'Step Tracking', likelyhood: 0.2, efficency: 0.9 }, 
  { name: 'sleep', label: 'Sleep Tracking', likelyhood: 0.5, efficency: 0.7 },
  { name: 'food', label: 'Food Tracking', likelyhood: 0.7, efficency: 0.5 }
]
genders = ['female','male']
daily_max = 5
daily_tracked_rate = 0.5
start_date = Date.new(2014, 01, 01)
end_date = Date.new(2014, 12, 31)

num_users.times do |i|
  user = { 
    uid: (0...10).map { ('a'..'z').to_a[rand(26)] }.join,
    gender: genders[rand.round],
    age: 25 + (rand * 10).round + (rand * 10).round
  }
  # puts user
  users << user
end

puts headers.join(',')+"\n"

(start_date..end_date).each do |date|
  # puts date
  users.each do |user|
    amounts = []
    incentives.each do |incentive|
      if rand > incentive[:likelyhood]
        amounts << (daily_max * rand(incentive[:efficency])).round
      else
        amounts << 0
      end
    end
    row = [date, user[:uid], user[:gender], user[:age], amounts[0], amounts[1], amounts[2], daily_max]
    puts row.join(',')+"\n"
  end
end

# puts rows.join(',')+"\n"

# file = Tempfile.new('~/Dev/dc.js/tmp/incentives.csv')
# file = Tempfile.new('incentives')
# puts file.path
# CSV.open(file, 'w') do |csv|
#   csv << headers
#   rows.each do |row|
#     csv << row
#   end
# end



