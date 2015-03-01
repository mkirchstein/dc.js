require 'date'
require 'tempfile'
require 'csv'

class Array
  def sum
    inject(0.0) { |result, el| result + el }
  end

  def mean 
    sum / size
  end
end

num_users = 100
headers = ['"date"', '"gender"', '"age"', '"incentive"', '"amount"', '"amount_possible"']
genders = ['Male','Female']
gender_bias = 0.6
start_date = Date.new(2015, 01, 01)
end_date = Date.new(2015, 12, 31)
incentives = [
  { name: 'Activity', label: 'Step Tracking', likelyhood: 8, efficacy: 9, daily_max: 5 }, 
  { name: 'Sleep', label: 'Sleep Tracking', likelyhood: 6, efficacy: 7, daily_max: 3 },
  { name: 'Food', label: 'Food Tracking', likelyhood: 4, efficacy: 5, daily_max: 4 }
]
wday_likelyhood = {
  0 => 4,
  1 => 5,
  2 => 6,
  3 => 7,
  4 => 8,
  5 => 8,
  6 => 6
}
wday_efficacy = {
  0 => 4,
  1 => 5,
  2 => 6,
  3 => 7,
  4 => 8,
  5 => 8,
  6 => 6
}
month_likelyhood = {
  1 => 3,
  2 => 4,
  3 => 6,
  4 => 6,
  5 => 7,
  6 => 7,
  7 => 8,
  8 => 9,
  9 => 7,
  10 => 5,
  11 => 4,
  12 => 3
}
month_efficacy = {
  1 => 1,
  2 => 2,
  3 => 3,
  4 => 4,
  5 => 5,
  6 => 6,
  7 => 7,
  8 => 5,
  9 => 4,
  10 => 3,
  11 => 2,
  12 => 1
}
age_likelyhood = {
  18 => 9,
  19 => 9,
  20 => 9,
  21 => 9,
  22 => 9,
  23 => 9,
  24 => 9,
  25 => 9,
  26 => 9,
  27 => 9,
  28 => 9,
  29 => 8,
  30 => 8,
  31 => 8,
  32 => 8,
  33 => 9,
  34 => 9,
  35 => 9,
  36 => 9,
  37 => 9,
  38 => 9,
  39 => 7,
  40 => 7,
  41 => 7,
  42 => 7,
  43 => 7,
  44 => 7,
  45 => 8,
  46 => 8,
  47 => 8,
  48 => 8,
  49 => 8,
  50 => 5,
  51 => 5,
  52 => 6,
  53 => 5,
  54 => 5,
  55 => 3,
  56 => 3,
  57 => 3,
  58 => 3,
  59 => 3,
  60 => 3,
  61 => 3,
  62 => 3,
  63 => 3,
  64 => 3,
  65 => 3,
  66 => 3,
  67 => 3,
  68 => 3,
  69 => 3
}
age_efficacy = {
  18 => 4,
  19 => 4,
  20 => 5,
  21 => 5,
  22 => 6,
  23 => 8,
  24 => 8,
  25 => 8,
  26 => 8,
  27 => 8,
  28 => 8,
  29 => 8,
  30 => 8,
  31 => 8,
  32 => 8,
  33 => 9,
  34 => 9,
  35 => 9,
  36 => 9,
  37 => 9,
  38 => 9,
  39 => 7,
  40 => 7,
  41 => 7,
  42 => 7,
  43 => 7,
  44 => 7,
  45 => 8,
  46 => 8,
  47 => 8,
  48 => 8,
  49 => 8,
  50 => 5,
  51 => 5,
  52 => 6,
  53 => 5,
  54 => 5,
  55 => 3,
  56 => 3,
  57 => 3,
  58 => 3,
  59 => 3,
  60 => 3,
  61 => 3,
  62 => 3,
  63 => 3,
  64 => 3,
  65 => 3,
  66 => 3,
  67 => 3,
  68 => 3,
  69 => 3
}
rows = []
users = []

num_users.times do |i|
  user = { 
    uid: (0...10).map { ('a'..'z').to_a[rand(26)] }.join,
    gender: (rand < gender_bias ? genders[0] : genders[1]),
    age: (18 + rand * 40).round
  }
  users << user
end

puts headers.join(',')+"\n"

(start_date..end_date).each do |date|
  users.each do |user|
    incentives.each do |incentive|
      likelyhoods = rand*incentive[:likelyhood] + rand*wday_likelyhood[date.wday] + rand*month_likelyhood[date.month] + rand*age_likelyhood[user[:age]]
      if rand*35 < likelyhoods
        efficacy = rand*incentive[:efficacy] + rand*wday_efficacy[date.wday] + rand*month_efficacy[date.month] + rand*age_efficacy[user[:age]]
        amount = (incentive[:daily_max] * efficacy / 25).round
        if(amount > 0)
          row = [date, user[:gender], user[:age], incentive[:name], amount, incentive[:daily_max]]
          # rows << row
          puts row.join(',')+"\n"
        end
      end
    end
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



